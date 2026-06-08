import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { GRID_SIZE, PIXEL_PRICE_USD_CENTS, PIXEL_PRICE_GBP_PENCE } from "@/lib/grid/constants";
import { countryZodEnum } from "@/lib/countries";

const schema = z.object({
  x: z.number().int().min(0).max(GRID_SIZE - 1),
  y: z.number().int().min(0).max(GRID_SIZE - 1),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  currency: z.enum(["USD", "GBP"]),
  paintedPixelCount: z.number().int().min(1).optional(),
  country: countryZodEnum,
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
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { x, y, width, height, currency, paintedPixelCount, country } = parsed.data;

  // Bounds check
  if (x + width > GRID_SIZE || y + height > GRID_SIZE) {
    return NextResponse.json({ error: "Selection exceeds grid boundaries" }, { status: 400 });
  }

  // Charge for painted pixels only; fall back to full bounding box if not provided
  const billablePixels = paintedPixelCount ?? width * height;
  const priceMinorUnit = billablePixels * (currency === "GBP" ? PIXEL_PRICE_GBP_PENCE : PIXEL_PRICE_USD_CENTS);

  // Create a PENDING_PAYMENT reservation.
  // The DB exclusion constraint will prevent overlapping ACTIVE/LISTED blocks,
  // but PENDING_PAYMENT rows can co-exist (race handled at webhook time).
  try {
    const block = await prisma.pixelBlock.create({
      data: {
        x,
        y,
        width,
        height,
        ownerEmail: "", // set on webhook
        currency,
        priceMinorUnit,
        country,
        paintedPixelCount: billablePixels,
        status: "PENDING_PAYMENT",
      },
      select: { id: true },
    });
    return NextResponse.json({ blockId: block.id });
  } catch (err) {
    // P2002 = unique constraint, P2034 = exclusion constraint violation
    const code = (err as { code?: string }).code;
    if (code === "P2002" || code === "P2034") {
      return NextResponse.json({ error: "Some of those pixels are already taken" }, { status: 409 });
    }
    console.error("reserve error", err);
    return NextResponse.json({ error: "Failed to reserve pixels" }, { status: 500 });
  }
}
