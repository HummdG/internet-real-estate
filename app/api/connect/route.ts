import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  editToken: z.string().min(1),
  blockId: z.string().min(1),
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

  const { editToken, blockId } = parsed.data;

  const block = await prisma.pixelBlock.findFirst({
    where: { id: blockId, editToken },
  });

  if (!block) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  let accountId = block.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { blockId, ownerEmail: block.ownerEmail },
    });
    accountId = account.id;
    await prisma.pixelBlock.update({
      where: { id: blockId },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${BASE_URL}/edit/${editToken}?connect=refresh`,
    return_url: `${BASE_URL}/edit/${editToken}?connect=done`,
  });

  return NextResponse.json({ url: accountLink.url });
}
