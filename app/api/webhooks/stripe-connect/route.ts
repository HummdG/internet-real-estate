import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendMarketplaceBuyerEmail, sendSaleCompleteEmail } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Connect webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { listingId, buyerEmail, country } = session.metadata ?? {};

    if (!listingId || !buyerEmail) {
      console.error("Missing metadata on connect session", session.id);
      return NextResponse.json({ ok: true });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId, active: true },
      include: { pixelBlock: true },
    });

    if (!listing) {
      console.error("Listing not found or already inactive:", listingId);
      return NextResponse.json({ ok: true });
    }

    const { pixelBlock: block } = listing;
    const sellerEmail = block.ownerEmail;

    // Transfer ownership atomically
    try {
      await prisma.$transaction(
        async (tx) => {
          // Generate a fresh editToken for the new owner
          const { randomUUID } = await import("crypto");
          const newEditToken = randomUUID();
          const newSlug = randomUUID();

          await tx.pixelBlock.update({
            where: { id: block.id },
            data: {
              ownerEmail: buyerEmail,
              editToken: newEditToken,
              publicSlug: newSlug,
              status: "ACTIVE",
              stripeConnectAccountId: null,
              // Flag follows the current owner; fall back to the block's
              // existing nation if metadata is somehow missing.
              country: country ?? block.country,
            },
          });

          await tx.listing.update({
            where: { id: listingId },
            data: { active: false, soldAt: new Date() },
          });

          const platformFee = Math.round(listing.askPriceMinorUnit * 0.02);

          await tx.transaction.create({
            data: {
              pixelBlockId: block.id,
              type: "RESALE",
              buyerEmail,
              sellerEmail,
              amountMinorUnit: listing.askPriceMinorUnit,
              platformFeeMinorUnit: platformFee,
              currency: listing.currency,
              country: country ?? block.country,
              stripePaymentIntentId: session.payment_intent as string,
            },
          });

          await tx.auditLog.create({
            data: {
              event: "resale_completed",
              payload: { listingId, blockId: block.id, buyerEmail, sellerEmail },
            },
          });

          // Send emails after transaction committed
          const freshBlock = await tx.pixelBlock.findUnique({ where: { id: block.id } });
          if (freshBlock) {
            await sendMarketplaceBuyerEmail({
              to: buyerEmail,
              editToken: freshBlock.editToken,
              pixelCount: block.width * block.height,
              width: block.width,
              height: block.height,
              x: block.x,
              y: block.y,
            });
            await sendSaleCompleteEmail({
              to: sellerEmail,
              amountMinorUnit: listing.askPriceMinorUnit,
              platformFeeMinorUnit: platformFee,
              currency: listing.currency,
            });
          }
        },
        { isolationLevel: "Serializable" }
      );
    } catch (err) {
      console.error("Resale transfer failed:", err);
      await prisma.auditLog.create({
        data: { event: "resale_transfer_failed", payload: { listingId, error: String(err) } },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
