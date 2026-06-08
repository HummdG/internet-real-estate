import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPurchaseConfirmation } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { blockId, editToken } = session.metadata ?? {};

    if (!blockId || !editToken) {
      console.error("Missing metadata on session", session.id);
      return NextResponse.json({ ok: true });
    }

    try {
      const activatedBlock = await prisma.pixelBlock.update({
        where: { id: blockId, editToken },
        data: {
          status: "ACTIVE",
          ownerEmail: session.customer_email ?? session.customer_details?.email ?? "",
          currency: (session.currency?.toUpperCase() as "USD" | "GBP") ?? "USD",
          priceMinorUnit: session.amount_total ?? 0,
          purchasedAt: new Date(),
        },
      });

      await prisma.transaction.create({
        data: {
          pixelBlockId: blockId,
          type: "INITIAL_PURCHASE",
          buyerEmail: session.customer_email ?? session.customer_details?.email ?? "",
          amountMinorUnit: session.amount_total ?? 0,
          currency: (session.currency?.toUpperCase() as "USD" | "GBP") ?? "USD",
          country: activatedBlock.country, // immutable attribution for spend/fan leaderboards
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      await prisma.auditLog.create({
        data: { event: "initial_purchase_completed", payload: { blockId, sessionId: session.id } },
      });

      // Send edit link email
      const block = await prisma.pixelBlock.findUnique({ where: { id: blockId } });
      if (block) {
        await sendPurchaseConfirmation({
          to: block.ownerEmail,
          editToken: block.editToken,
          pixelCount: block.width * block.height,
          width: block.width,
          height: block.height,
          x: block.x,
          y: block.y,
        });
      }
    } catch (err) {
      // Exclusion constraint violation means another block already claimed these pixels
      const code = (err as { code?: string }).code;
      if (code === "P2002" || code === "P2034") {
        console.error("Pixel overlap on activation, issuing refund", blockId);
        await prisma.auditLog.create({
          data: { event: "pixel_overlap_refund", payload: { blockId, sessionId: session.id } },
        });
        // Refund the payment
        if (session.payment_intent) {
          try {
            await stripe.refunds.create({ payment_intent: session.payment_intent as string });
          } catch (refundErr) {
            console.error("Refund failed:", refundErr);
          }
        }
        // Optionally: send apology email (omitted for now, add later)
      } else {
        throw err;
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { blockId } = session.metadata ?? {};
    if (blockId) {
      await prisma.pixelBlock.deleteMany({
        where: { id: blockId, status: "PENDING_PAYMENT" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
