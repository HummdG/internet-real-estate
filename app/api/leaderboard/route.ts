import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOTAL_PIXELS } from "@/lib/grid/constants";
import type { CountryStanding } from "@/lib/leaderboard";

// Dynamic (queries the DB per request), like /api/grid, it must not be
// prerendered at build time. Liveness/caching is handled by the Cache-Control
// header below: cheap under load via the CDN, "live enough" at 30s.
export const dynamic = "force-dynamic";

export async function GET() {
  // Pixels per country reflect the CURRENT board (PixelBlock.country), so the
  // ranking matches what the grid shows and the "highlight a nation" feature.
  const pixelRows = await prisma.$queryRaw<{ country: string; pixels: number }[]>`
    SELECT country, COALESCE(SUM("paintedPixelCount"), 0)::int AS pixels
    FROM "PixelBlock"
    WHERE status IN ('ACTIVE', 'LISTED') AND country IS NOT NULL
    GROUP BY country
  `;

  // Distinct fans come from Transaction history (survives resale).
  const fanRows = await prisma.$queryRaw<{ country: string; fans: number }[]>`
    SELECT country, COUNT(DISTINCT "buyerEmail")::int AS fans
    FROM "Transaction"
    WHERE country IS NOT NULL
    GROUP BY country
  `;

  // Spend from Transaction history, split by currency (USD and GBP are never summed).
  const spendRows = await prisma.transaction.groupBy({
    by: ["country", "currency"],
    where: { country: { not: null } },
    _sum: { amountMinorUnit: true },
  });

  // Total occupancy across ALL blocks (incl. any legacy untagged rows) for the
  // sold/remaining headline; falls back to bounding-box area where painted count is null.
  const soldAgg = await prisma.$queryRaw<{ sold: number }[]>`
    SELECT COALESCE(SUM(COALESCE("paintedPixelCount", width * height)), 0)::int AS sold
    FROM "PixelBlock"
    WHERE status IN ('ACTIVE', 'LISTED')
  `;

  const standings = new Map<string, CountryStanding>();
  const ensure = (code: string): CountryStanding => {
    let s = standings.get(code);
    if (!s) {
      s = { code, pixels: 0, spent: { USD: 0, GBP: 0 }, fans: 0 };
      standings.set(code, s);
    }
    return s;
  };

  for (const r of pixelRows) ensure(r.country).pixels = Number(r.pixels);
  for (const r of fanRows) ensure(r.country).fans = Number(r.fans);
  for (const r of spendRows) {
    if (!r.country) continue;
    const amount = r._sum.amountMinorUnit ?? 0;
    const s = ensure(r.country);
    if (r.currency === "USD") s.spent.USD += amount;
    else if (r.currency === "GBP") s.spent.GBP += amount;
  }

  // Default order = most pixels painted (the headline loyalty metric).
  const countries = [...standings.values()].sort((a, b) => b.pixels - a.pixels);

  const pixelsSold = Number(soldAgg[0]?.sold ?? 0);

  return NextResponse.json(
    {
      countries,
      totals: {
        pixelsSold,
        pixelsRemaining: Math.max(0, TOTAL_PIXELS - pixelsSold),
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
