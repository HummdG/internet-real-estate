import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  blockId: z.string().min(1),
  email: z.string().email(),
  currency: z.enum(["USD", "GBP"]),
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

  const { blockId, email, currency } = parsed.data;

  const block = await prisma.pixelBlock.findUnique({
    where: { id: blockId, status: "PENDING_PAYMENT" },
  });

  if (!block) {
    return NextResponse.json({ error: "Reservation not found or expired" }, { status: 404 });
  }

  // Use priceMinorUnit to derive the billed pixel count (may differ from bounding box area)
  const billedPixelCount = Math.round(block.priceMinorUnit / 100);
  const currencyLower = currency.toLowerCase() as "usd" | "gbp";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    currency: currencyLower,
    line_items: [
      {
        price_data: {
          currency: currencyLower,
          unit_amount: 100, // $1 / £1 per pixel
          product_data: {
            name: `${billedPixelCount.toLocaleString()} Pixels on The Fan Wall`,
            description: `${block.width}×${block.height} block at (${block.x}, ${block.y})`,
          },
        },
        quantity: billedPixelCount,
      },
    ],
    success_url: `${BASE_URL}/edit/${block.editToken}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}?cancelled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    metadata: {
      blockId: block.id,
      editToken: block.editToken,
    },
  });

  // Store session ID on block
  await prisma.pixelBlock.update({
    where: { id: blockId },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
