import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  listingToken: z.string().min(1),
  listingId: z.string().min(1),
});

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

  const { listingToken, listingId } = parsed.data;

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, listingToken, active: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.listing.update({ where: { id: listingId }, data: { active: false } }),
    prisma.pixelBlock.update({ where: { id: listing.pixelBlockId }, data: { status: "ACTIVE" } }),
  ]);

  return NextResponse.json({ ok: true });
}
