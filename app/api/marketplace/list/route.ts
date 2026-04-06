import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  editToken: z.string().min(1),
  blockId: z.string().min(1),
  askPrice: z.number().int().min(100), // minimum 100 minor units ($1/£1)
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

  const { editToken, blockId, askPrice, currency } = parsed.data;

  const block = await prisma.pixelBlock.findFirst({
    where: { id: blockId, editToken, status: "ACTIVE" },
    include: { listing: true },
  });

  if (!block) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  if (block.listing?.active) {
    return NextResponse.json({ error: "Already listed for sale" }, { status: 400 });
  }

  // Ensure seller has a Stripe Connect account
  let stripeAccountId = block.stripeConnectAccountId;
  let onboardingRequired = false;
  let connectUrl: string | undefined;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { blockId, ownerEmail: block.ownerEmail },
    });
    stripeAccountId = account.id;
    await prisma.pixelBlock.update({
      where: { id: blockId },
      data: { stripeConnectAccountId: stripeAccountId },
    });
  }

  // Check if onboarding is complete
  const account = await stripe.accounts.retrieve(stripeAccountId);
  if (!account.details_submitted) {
    onboardingRequired = true;
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: "account_onboarding",
      refresh_url: `${BASE_URL}/edit/${editToken}?connect=refresh`,
      return_url: `${BASE_URL}/edit/${editToken}?connect=done`,
    });
    connectUrl = accountLink.url;
  }

  // Create listing record
  const listing = await prisma.listing.upsert({
    where: { pixelBlockId: blockId },
    create: {
      pixelBlockId: blockId,
      askPriceMinorUnit: askPrice,
      currency,
      stripeOnboarded: !onboardingRequired,
    },
    update: {
      askPriceMinorUnit: askPrice,
      currency,
      active: true,
      soldAt: null,
      stripeOnboarded: !onboardingRequired,
    },
  });

  if (!onboardingRequired) {
    await prisma.pixelBlock.update({ where: { id: blockId }, data: { status: "LISTED" } });
  }

  return NextResponse.json({
    listingId: listing.id,
    onboardingRequired,
    connectUrl,
  });
}
