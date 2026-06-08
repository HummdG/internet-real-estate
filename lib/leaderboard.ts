// Shared shapes for the country loyalty leaderboard (GET /api/leaderboard).

export interface CountryStanding {
  code: string;
  /** Current board area painted for this nation (sum of paintedPixelCount). */
  pixels: number;
  /** Spend in minor units, kept separate per currency (never summed across). */
  spent: { USD: number; GBP: number };
  /** Distinct buyers all-time for this nation. */
  fans: number;
}

export interface LeaderboardData {
  countries: CountryStanding[];
  totals: { pixelsSold: number; pixelsRemaining: number };
}

/** Combined spend across currencies, for ranking only (display keeps them split). */
export function totalSpentMinor(s: CountryStanding): number {
  return s.spent.USD + s.spent.GBP;
}
