import { z } from "zod";

/**
 * The 48 nations of the 2026 FIFA World Cup, used to tag every pixel block
 * and power the loyalty leaderboard.
 *
 * ⚠️ ROSTER IS PROVISIONAL. This is a best-effort list assembled before the
 * official confederation allocations were finalised. Confirm against the
 * official FIFA list (and fill the two intercontinental play-off slots) before
 * any public launch. Codes are FIFA tri-codes (≈ ISO 3166-1 alpha-3), which,
 * unlike alpha-2, can represent the home nations (England/Scotland/Wales).
 */
export interface WorldCupCountry {
  /** FIFA tri-code, e.g. "BRA". Stable identifier stored on blocks/transactions. */
  code: string;
  /** Display name, e.g. "Brazil". */
  name: string;
  /** Flag emoji for chips and the picker. */
  flagEmoji: string;
  /** Primary national-team colour (hex), drives grid highlight tint + chips. */
  primaryColor: string;
  /** Secondary national-team colour (hex). */
  secondaryColor: string;
}

export const WORLD_CUP_2026: WorldCupCountry[] = [
  { code: "ALG", name: "Algeria", flagEmoji: "🇩🇿", primaryColor: "#006233", secondaryColor: "#FFFFFF" },
  { code: "ARG", name: "Argentina", flagEmoji: "🇦🇷", primaryColor: "#75AADB", secondaryColor: "#FFFFFF" },
  { code: "AUS", name: "Australia", flagEmoji: "🇦🇺", primaryColor: "#00843D", secondaryColor: "#FFCD00" },
  { code: "AUT", name: "Austria", flagEmoji: "🇦🇹", primaryColor: "#ED2939", secondaryColor: "#FFFFFF" },
  { code: "BEL", name: "Belgium", flagEmoji: "🇧🇪", primaryColor: "#ED2939", secondaryColor: "#000000" },
  { code: "BRA", name: "Brazil", flagEmoji: "🇧🇷", primaryColor: "#FFDF00", secondaryColor: "#009C3B" },
  { code: "CMR", name: "Cameroon", flagEmoji: "🇨🇲", primaryColor: "#007A5E", secondaryColor: "#CE1126" },
  { code: "CAN", name: "Canada", flagEmoji: "🇨🇦", primaryColor: "#FF0000", secondaryColor: "#FFFFFF" },
  { code: "COL", name: "Colombia", flagEmoji: "🇨🇴", primaryColor: "#FCD116", secondaryColor: "#003893" },
  { code: "CRC", name: "Costa Rica", flagEmoji: "🇨🇷", primaryColor: "#002B7F", secondaryColor: "#CE1126" },
  { code: "CRO", name: "Croatia", flagEmoji: "🇭🇷", primaryColor: "#FF0000", secondaryColor: "#171796" },
  { code: "DEN", name: "Denmark", flagEmoji: "🇩🇰", primaryColor: "#C60C30", secondaryColor: "#FFFFFF" },
  { code: "ECU", name: "Ecuador", flagEmoji: "🇪🇨", primaryColor: "#FFDD00", secondaryColor: "#034EA2" },
  { code: "EGY", name: "Egypt", flagEmoji: "🇪🇬", primaryColor: "#CE1126", secondaryColor: "#FFFFFF" },
  { code: "ENG", name: "England", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", primaryColor: "#FFFFFF", secondaryColor: "#CE1124" },
  { code: "FRA", name: "France", flagEmoji: "🇫🇷", primaryColor: "#0055A4", secondaryColor: "#EF4135" },
  { code: "GER", name: "Germany", flagEmoji: "🇩🇪", primaryColor: "#000000", secondaryColor: "#FFCE00" },
  { code: "GHA", name: "Ghana", flagEmoji: "🇬🇭", primaryColor: "#006B3F", secondaryColor: "#FCD116" },
  { code: "IRN", name: "Iran", flagEmoji: "🇮🇷", primaryColor: "#239F40", secondaryColor: "#DA0000" },
  { code: "IRQ", name: "Iraq", flagEmoji: "🇮🇶", primaryColor: "#007A3D", secondaryColor: "#CE1126" },
  { code: "ITA", name: "Italy", flagEmoji: "🇮🇹", primaryColor: "#0066CC", secondaryColor: "#FFFFFF" },
  { code: "CIV", name: "Ivory Coast", flagEmoji: "🇨🇮", primaryColor: "#FF8200", secondaryColor: "#009E60" },
  { code: "JAM", name: "Jamaica", flagEmoji: "🇯🇲", primaryColor: "#009B3A", secondaryColor: "#FED100" },
  { code: "JPN", name: "Japan", flagEmoji: "🇯🇵", primaryColor: "#0033A0", secondaryColor: "#FFFFFF" },
  { code: "MEX", name: "Mexico", flagEmoji: "🇲🇽", primaryColor: "#006847", secondaryColor: "#CE1126" },
  { code: "MAR", name: "Morocco", flagEmoji: "🇲🇦", primaryColor: "#C1272D", secondaryColor: "#006233" },
  { code: "NED", name: "Netherlands", flagEmoji: "🇳🇱", primaryColor: "#FF6C00", secondaryColor: "#FFFFFF" },
  { code: "NZL", name: "New Zealand", flagEmoji: "🇳🇿", primaryColor: "#FFFFFF", secondaryColor: "#00247D" },
  { code: "NGA", name: "Nigeria", flagEmoji: "🇳🇬", primaryColor: "#008751", secondaryColor: "#FFFFFF" },
  { code: "NOR", name: "Norway", flagEmoji: "🇳🇴", primaryColor: "#BA0C2F", secondaryColor: "#00205B" },
  { code: "PAN", name: "Panama", flagEmoji: "🇵🇦", primaryColor: "#005293", secondaryColor: "#DA121A" },
  { code: "PAR", name: "Paraguay", flagEmoji: "🇵🇾", primaryColor: "#D52B1E", secondaryColor: "#0038A8" },
  { code: "POL", name: "Poland", flagEmoji: "🇵🇱", primaryColor: "#DC143C", secondaryColor: "#FFFFFF" },
  { code: "POR", name: "Portugal", flagEmoji: "🇵🇹", primaryColor: "#DA291C", secondaryColor: "#006600" },
  { code: "QAT", name: "Qatar", flagEmoji: "🇶🇦", primaryColor: "#8A1538", secondaryColor: "#FFFFFF" },
  { code: "KSA", name: "Saudi Arabia", flagEmoji: "🇸🇦", primaryColor: "#006C35", secondaryColor: "#FFFFFF" },
  { code: "SCO", name: "Scotland", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", primaryColor: "#0065BF", secondaryColor: "#FFFFFF" },
  { code: "SEN", name: "Senegal", flagEmoji: "🇸🇳", primaryColor: "#00853F", secondaryColor: "#FDEF42" },
  { code: "SRB", name: "Serbia", flagEmoji: "🇷🇸", primaryColor: "#C6363C", secondaryColor: "#0C4076" },
  { code: "KOR", name: "South Korea", flagEmoji: "🇰🇷", primaryColor: "#C60C30", secondaryColor: "#003478" },
  { code: "ESP", name: "Spain", flagEmoji: "🇪🇸", primaryColor: "#AA151B", secondaryColor: "#F1BF00" },
  { code: "SUI", name: "Switzerland", flagEmoji: "🇨🇭", primaryColor: "#D52B1E", secondaryColor: "#FFFFFF" },
  { code: "TUN", name: "Tunisia", flagEmoji: "🇹🇳", primaryColor: "#E70013", secondaryColor: "#FFFFFF" },
  { code: "TUR", name: "Türkiye", flagEmoji: "🇹🇷", primaryColor: "#E30A17", secondaryColor: "#FFFFFF" },
  { code: "UAE", name: "United Arab Emirates", flagEmoji: "🇦🇪", primaryColor: "#00732F", secondaryColor: "#FF0000" },
  { code: "USA", name: "United States", flagEmoji: "🇺🇸", primaryColor: "#002868", secondaryColor: "#BF0A30" },
  { code: "URU", name: "Uruguay", flagEmoji: "🇺🇾", primaryColor: "#5CABE3", secondaryColor: "#FFFFFF" },
  { code: "WAL", name: "Wales", flagEmoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", primaryColor: "#C8102E", secondaryColor: "#00B140" },
];

/** All valid country codes, in display order. */
export const COUNTRY_CODES: readonly string[] = WORLD_CUP_2026.map((c) => c.code);

/** O(1) lookup from tri-code to country metadata. */
export const countryByCode: Record<string, WorldCupCountry> = Object.fromEntries(
  WORLD_CUP_2026.map((c) => [c.code, c])
);

/** Zod validator for API routes: rejects any code not in the roster. */
export const countryZodEnum = z.enum(COUNTRY_CODES as [string, ...string[]]);

/** Resolve a code to its country, or undefined if unknown. */
export function getCountry(code: string | null | undefined): WorldCupCountry | undefined {
  return code ? countryByCode[code] : undefined;
}
