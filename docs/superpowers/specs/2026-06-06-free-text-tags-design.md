# Free-text tags (replacing forced 48-nation tagging)

Date: 2026-06-06
Status: Approved design, pending spec review

## Goal

Today every pixel block is locked to one of the 48 World Cup nations: the picker is a
flag grid, the leaderboard ranks FIFA countries, and the copy is all "fly your flag /
your nation" framing. We want buyers to tag a block with **anything** they like (a
country, a club, a city, a crew, a cause), while keeping the country autocomplete and
flags as a convenience, and keeping The Fan Wall name, look, jumbotron, and leaderboard
intact. We also remove every em dash in the repo.

## Decisions (locked)

1. **Tag type:** free-text. Buyer types whatever they want.
2. **Branding:** unchanged name, fonts, colors, jumbotron, leaderboard. Only the few
   lines that hard-lock you to a nation get reworded.
3. **Input:** a text field with country autocomplete. Typing surfaces matching countries
   with their flag; you can pick a suggestion or commit your own text.
4. **Moderation:** none. Only a 40-character cap for DB/layout hygiene.
5. **Em dashes:** removed everywhere (UI copy, code comments, and docs incl.
   CLAUDE.md / AGENTS.md), each replaced with context-appropriate punctuation.

## Storage model (no DB migration)

`PixelBlock.country` and `Transaction.country` are already `String?` (Postgres TEXT), so
free text fits with zero schema change. The columns keep their names (renaming would
force a migration and buys nothing); only their meaning changes, from "FIFA tri-code" to
"display tag". Comments updated accordingly.

Storage rule:
- Store the tag as the human-readable string the buyer committed (trimmed, whitespace
  collapsed, capped at 40 chars). Picking "Brazil" from autocomplete stores `Brazil`;
  free text stores it as typed.
- Flags are resolved at render time by matching the stored string against the known
  country list (by name or tri-code, case-insensitive). `brazil`, `Brazil`, `BRA` all
  resolve to the Brazil flag; `my cat` resolves to nothing and shows a neutral marker.
- The leaderboard groups case-insensitively, so `Brazil` and `brazil` merge into one row.

Alternative considered and rejected: a structured code-vs-text column. It needs a
migration and the string-resolve approach already gives flags + grouping for free.

## New helpers in `lib/countries.ts`

Keep `WORLD_CUP_2026`, `countryByCode`, `getCountry`. Add:

- `normalizeTag(raw: string): string`: trim, collapse internal whitespace to single
  spaces, slice to 40 chars. The display form that gets stored.
- `tagKey(raw: string): string`: `normalizeTag(raw).toLowerCase()`. The grouping and
  match key.
- `resolveCountryByTag(tag): WorldCupCountry | undefined`: match `tagKey(tag)` against a
  lookup built from lowercased country names and tri-codes. Returns the country (for flag
  + color) or undefined.
- `tagColor(tag): string`: deterministic hex derived from hashing the tag (hash to hue,
  HSL to hex). Used to tint the grid highlight and leaderboard bar when no country
  resolves.
- `tagSchema = z.string().trim().min(1).max(40)`: the validator that replaces
  `countryZodEnum` in the API routes.

Remove `countryZodEnum` and `COUNTRY_CODES` if they become unused after the swap (verify
no other references first).

## Validation changes

- `app/api/blocks/reserve/route.ts`: `country: countryZodEnum` becomes `country: tagSchema`.
- `app/api/marketplace/buy/route.ts`: same swap.

Both already store/forward whatever string passes validation, so no further logic change.

## TagInput component (replaces CountryPicker)

New `components/TagInput.tsx`, same `value` / `onChange` contract (value is now the tag
string, not a tri-code). Behavior:
- A text input. As the user types, matching countries (by name/code) appear below as
  suggestions, each with its flag, like the current picker rows.
- Clicking a suggestion fills the input with that country's canonical name and commits.
- Pressing Enter or blurring commits the current text as the tag.
- Themed entirely via the existing CSS variables, matching the current picker styling.

`components/CountryPicker.tsx` is deleted. Both consumers (`PurchaseModal`,
`BlockInfoModal` resale form) import `TagInput` instead.

## Leaderboard

### API `app/api/leaderboard/route.ts`
Keep the three existing queries grouping by exact `country`, then fold the rows together
in JS keyed by `tagKey(country)`, accumulating pixels / fans / spend per key and tracking
a display label (prefer `resolveCountryByTag(label)?.name`, else the first raw label
seen). This keeps the SQL simple and does the case-insensitive merge in one place. The
sold/remaining headline query is unchanged.

### Shape `lib/leaderboard.ts`
```ts
export interface Standing {
  tag: string;            // display label
  countryCode?: string;   // resolved FIFA code if the tag maps to a known country
  pixels: number;
  spent: { USD: number; GBP: number };
  fans: number;
}
export interface LeaderboardData {
  standings: Standing[];  // renamed from `countries`
  totals: { pixelsSold: number; pixelsRemaining: number };
}
```
`totalSpentMinor` keeps working on `Standing`.

### `components/leaderboard/LeaderboardHero.tsx`
- Props `countries` -> `standings`, `highlightCountry` -> `highlightTag`,
  `onSelectCountry` -> `onSelectTag`.
- Per row: `const c = s.countryCode ? countryByCode[s.countryCode] : undefined`.
  Flag = `c?.flagEmoji ?? "🏳️"`, name = `c?.name ?? s.tag`,
  barColor = `c?.primaryColor ?? tagColor(s.tag)`.
- Active state and key use `s.tag` / `tagKey`.
- Empty-state copy reworded (see copy table).

## Grid highlight

- `components/grid/PixelGrid.tsx`: prop `highlightCountry` -> `highlightTag`. Match with
  `tagKey(b.country) === tagKey(highlightTag)`. Fill color =
  `resolveCountryByTag(highlightTag)?.primaryColor ?? tagColor(highlightTag)`. Gold
  outline unchanged.
- `components/grid/PixelGridClient.tsx`: prop rename passthrough.
- `components/home/FanWallBoard.tsx`: state `highlightCountry`/`setHighlightCountry` ->
  `highlightTag`/`setHighlightTag`. The jumbotron strip resolves the tag for its
  "{flag} {tag} highlighted" label (flag only if resolved). Scoreboard count uses
  `data.standings.length` with label "Tags on the board".
- `BlockMeta.country` (lib/grid/blockIndex.ts) and `/api/grid` keep returning `country`;
  it now holds the tag. No structural change.

## BlockInfoModal

- `getCountry(block.country)` -> `resolveCountryByTag(block.country)`.
- The badge shows the tag always: flag if resolved, neutral marker (📍) if not. Text
  "Repping {tag}".
- Resale form uses `TagInput`; label reworded.

## Webhooks and marketplace (no logic change)

`app/api/webhooks/stripe/route.ts`, `app/api/webhooks/stripe-connect/route.ts`, and
`app/api/marketplace/buy/route.ts` pass the tag string through unchanged (Stripe metadata
allows it). Only comments that say "nation" are updated to "tag".

## Copy changes (flex the nation-locked lines)

| Location | Before | After (proposed) |
|---|---|---|
| `FanWallBoard` H1 | Every pixel a vote / for your **nation** | Every pixel a vote / for whatever you **rep** (shimmer on "rep") |
| `FanWallBoard` sub | Claim pixels, paint them, fly your flag. The more a nation's fans buy... Tap a country to light up its territory. | Claim pixels, paint them, tag them with whatever you rep. The more a tag's fans buy, the higher it climbs. Tap a tag to light up its territory on the wall. |
| `FanWallBoard` scoreboard | Nations on the board | Tags on the board |
| `app/page.tsx` CTA | Fly Your Flag ▸ | Claim Your Pixels ▸ |
| `app/page.tsx` step 01 | Pick your nation / Choose who you rep from all 48 World Cup sides... | Pick your tag / Tag your block with anything: a country, a club, a cause, your crew. Then drag across the wall to grab your pixels, $1 each. |
| `StadiumTicker` | Fly your flag | Rep anything |
| `SocialShareModal` | every pixel a vote for my nation. Fly your flag too: | every pixel a vote for what I rep. Stake your claim too: |
| `layout.tsx` title | The Fan Wall, Every pixel a vote for your nation. | The Fan Wall: every pixel a vote for whatever you rep. |
| `layout.tsx` description | Claim your pixels, fly your flag, top the leaderboard. | Claim your pixels, tag them with anything, top the leaderboard. |
| `PurchaseModal` label/placeholder/help/error | Your nation / Who are you repping? / Your pixels fly this flag... / Pick the nation you're repping before claiming. | Your tag / Brazil, your club, your crew, anything / Your pixels rep this tag on the leaderboard. / Add a tag before claiming. |
| `BlockInfoModal` | Repping {country} / Your nation | Repping {tag} / Your tag |
| `LeaderboardHero` empty | be the first to fly your flag. | be the first to stake your claim. |

Exact wording is open to your edit during review.

## Em-dash sweep

Replace all 47 em dashes across 15 files (UI strings, code comments, CLAUDE.md, AGENTS.md)
with context-appropriate punctuation (comma, colon, parentheses, or " - "), chosen per
occurrence rather than blanket-substituted.

## Out of scope (YAGNI)

- No content moderation / profanity filter.
- No DB migration, no new columns, no column rename.
- No marketplace or webhook logic change.
- No change to the overlap exclusion constraint or grid rendering pipeline.

## Test / verification notes

- `npm run build` passes (TypeScript: the `code` -> `tag` rename and prop renames are the
  main type churn to chase down).
- Manual: buy flow with a free-text tag and with an autocomplete pick; leaderboard merges
  `Brazil`/`brazil`; grid highlight tints both known-country and free-text tags; resale
  flow accepts a tag; emails/social/meta read correctly; grep the repo for em dashes returns
  zero matches.
