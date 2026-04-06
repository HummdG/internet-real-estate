import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { R2_PUBLIC_URL } from "@/lib/r2";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { active: true },
    include: {
      pixelBlock: {
        select: { id: true, x: true, y: true, width: true, height: true, imageKey: true },
      },
    },
    orderBy: { listedAt: "desc" },
  });

  return NextResponse.json(
    listings.map((l) => ({
      id: l.id,
      blockId: l.pixelBlockId,
      x: l.pixelBlock.x,
      y: l.pixelBlock.y,
      width: l.pixelBlock.width,
      height: l.pixelBlock.height,
      imageUrl: l.pixelBlock.imageKey ? `${R2_PUBLIC_URL}/${l.pixelBlock.imageKey}` : null,
      askPriceMinorUnit: l.askPriceMinorUnit,
      currency: l.currency,
      listedAt: l.listedAt,
    }))
  );
}
