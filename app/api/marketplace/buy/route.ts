import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { countryZodEnum } from "@/lib/countries";

const schema = z.object({
  listingId: z.string().min(1),
  buyerEmail: z.string().email(),
  currency: z.enum(["USD", "GBP"]),
  country: countryZodEnum,
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { listingId, buyerEmail, currency, country } = parsed.data;

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, active: true, stripeOnboarded: true },
    include: { pixelBlock: { select: { stripeConnectAccountId: true, width: true, height: true } } },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found or unavailable" }, { status: 404 });
  }

  const sellerAccountId = listing.pixelBlock.stripeConnectAccountId;
  if (!sellerAccountId) {
    return NextResponse.json({ error: "Seller not set up for payments" }, { status: 400 });
  }

  const platformFee = Math.round(listing.askPriceMinorUnit * 0.02);
  const pixelCount = listing.pixelBlock.width * listing.pixelBlock.height;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: buyerEmail,
    currency: currency.toLowerCase() as "usd" | "gbp",
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase() as "usd" | "gbp",
          unit_amount: listing.askPriceMinorUnit,
          product_data: {
            name: `${pixelCount.toLocaleString()} Pixels on The Fan Wall (Resale)`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: { destination: sellerAccountId },
    },
    success_url: `${BASE_URL}?purchased=1`,
    cancel_url: `${BASE_URL}?cancelled=1`,
    // country rides in metadata: unlike initial purchase there's no PENDING block
    // to carry the new buyer's nation, so the Connect webhook reads it from here.
    metadata: { listingId, buyerEmail, country },
  });

  // Reserve listing for this buyer
  await prisma.listing.update({
    where: { id: listingId },
    data: { buyerEmail, stripeSessionId: session.id },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
