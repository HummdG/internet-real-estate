import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMasterUrl } from "@/lib/grid/compositor";
import { R2_PUBLIC_URL } from "@/lib/r2";
import { BlockMeta } from "@/lib/grid/blockIndex";

export const revalidate = 0;

export async function GET() {
  const [blocks, masterUrl] = await Promise.all([
    prisma.pixelBlock.findMany({
      where: { status: { in: ["ACTIVE", "LISTED"] } },
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
        country: true,
        listing: {
          select: {
            askPriceMinorUnit: true,
            currency: true,
          },
          where: { active: true },
        },
      },
    }),
    getMasterUrl(),
  ]);

  const blockMeta: BlockMeta[] = blocks.map((b) => ({
    id: b.id,
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    publicSlug: b.publicSlug,
    imageUrl: b.imageKey ? `${R2_PUBLIC_URL}/${b.imageKey}` : null,
    linkUrl: b.linkUrl,
    altText: b.altText,
    listed: b.status === "LISTED",
    listingPrice: b.listing?.askPriceMinorUnit,
    listingCurrency: b.listing?.currency,
    country: b.country,
  }));

  return NextResponse.json({ masterImageUrl: masterUrl, blocks: blockMeta });
}
