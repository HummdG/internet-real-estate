import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { R2_PUBLIC_URL } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const block = await prisma.pixelBlock.findUnique({
    where: { id: blockId, status: { in: ["ACTIVE", "LISTED"] } },
    select: {
      id: true,
      x: true,
      y: true,
      width: true,
      height: true,
      publicSlug: true,
      imageKey: true,
      linkUrl: true,
      altText: true,
      status: true,
      purchasedAt: true,
      listing: {
        where: { active: true },
        select: { id: true, askPriceMinorUnit: true, currency: true },
      },
    },
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: block.id,
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    publicSlug: block.publicSlug,
    imageUrl: block.imageKey ? `${R2_PUBLIC_URL}/${block.imageKey}` : null,
    linkUrl: block.linkUrl,
    altText: block.altText,
    listed: block.status === "LISTED",
    purchasedAt: block.purchasedAt,
    listing: block.listing ?? null,
  });
}
