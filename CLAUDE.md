# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npx prisma migrate dev --name <name>   # Create and apply a DB migration
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma studio    # Open Prisma Studio (DB GUI)

# Test Stripe webhooks locally (requires stripe CLI):
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Architecture

**The Fan Wall**: a 2026 World Cup themed single-page app where fans buy pixels on a 1000×1000 grid for $1/£1 each, **tag each block with one of the 48 World Cup nations** at checkout, paint them with a pixel editor, and optionally resell them (2% platform fee). A live **country leaderboard** ranks nations by pixels painted, money spent, and number of fans, answering "which nation's fans are most loyal?".

### Key design decisions

- **No user accounts**: ownership is a secret `editToken` (UUID) emailed to the buyer after payment. Anyone with the token can edit their block via `/edit/[editToken]`.
- **Country tagging**: each `PixelBlock` and `Transaction` carries a `country` (FIFA tri-code from `lib/countries.ts`). `PixelBlock.country` is the current allegiance (drives the grid highlight + pixel-count); `Transaction.country` is immutable per-purchase attribution (drives spend/fan metrics, survives resale). `PixelBlock.paintedPixelCount` stores the painted (paid-for) pixels for the leaderboard. Aggregated by `GET /api/leaderboard`.
- **Theme**: light ("pitch day") + dark ("stadium night") via `data-theme` on `<html>`, set pre-paint by an inline script in `app/layout.tsx` and toggled by `components/ThemeToggle.tsx`. Components read CSS variables from `app/globals.css`.
- **Race condition protection**: a PostgreSQL exclusion constraint (`btree_gist`) on `PixelBlock` prevents overlapping owned blocks at the DB level. If two buyers pay for overlapping pixels simultaneously, the losing payment is automatically refunded via Stripe.
- **Grid rendering**: two-layer canvas: a static master PNG (served from Cloudflare R2 CDN) shows all artwork; a transparent `<canvas>` overlay handles selection/hover. The master PNG is updated server-side with `sharp` after every artwork save.
- **Spatial index**: a `Uint32Array` of 1M cells (4MB) maps each grid pixel to its owning block index in O(1). Built on the client from the `/api/grid` response.

### Payment flows

1. **Initial purchase**: `POST /api/blocks/reserve` → `POST /api/checkout` (Stripe Checkout) → webhook activates block → email sent with edit link
2. **Marketplace resale**: Owner lists via Stripe Connect Express → buyer pays via `POST /api/marketplace/buy` → Connect webhook transfers ownership (updates existing row with new editToken)

### Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router, TypeScript |
| Styling | Tailwind CSS v4 + inline styles (no component library) |
| Database | PostgreSQL + Prisma v5 ORM |
| Payments | Stripe Checkout + Stripe Connect Express |
| Email | Resend |
| Image storage | Cloudflare R2 (`lib/r2.ts`) |
| Image compositing | `sharp` (server-side, `serverExternalPackages` in next.config.ts) |
| Hosting | Vercel + Vercel Cron (5-min cleanup of stale reservations) |

### Critical files

- `prisma/schema.prisma`: data model; `PixelBlock`, `Listing`, `Transaction`, `AuditLog`
- `lib/grid/blockIndex.ts`: `Uint32Array` spatial index; `buildPixelOwnerMap`, `isRegionFree`, `getBlockAt`
- `lib/grid/compositor.ts`: `sharp`-based server-side PNG compositing onto the master grid image
- `components/grid/PixelGrid.tsx`: main canvas grid with zoom/pan, selection, hover
- `components/editor/PixelEditor.tsx`: full-screen pixel editor shell
- `components/editor/EditorCanvas.tsx`: `ImageData`-buffer drawing canvas (all tools write to this buffer)
- `app/api/webhooks/stripe/route.ts`: handles initial purchase; includes refund logic on DB constraint violation
- `app/api/webhooks/stripe-connect/route.ts`: handles marketplace resale; ownership transfer in `Serializable` transaction

### Environment variables

See `.env.example` for the full list. Critical ones:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_BASE_URL`: full URL (e.g. `https://thefanwall.com`)
- `CRON_SECRET`: checked by `/api/cron/cleanup` (called by Vercel Cron every 5 min)

### DB migration note

After running `prisma migrate dev`, add the overlap exclusion constraint manually:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "PixelBlock"
ADD CONSTRAINT pixel_block_no_overlap
EXCLUDE USING gist (
  int4range(x, x + width)  WITH &&,
  int4range(y, y + height) WITH &&
)
WHERE (status != 'PENDING_PAYMENT');
```

**Important:** The exclusion constraint above is applied by hand and is invisible to Prisma. Prefer **`npx prisma db push`** for additive changes (e.g. the `country` / `paintedPixelCount` columns) since it diffs only the new columns and leaves the constraint alone. Avoid `prisma migrate dev` on this DB unless you re-apply the constraint afterward, since it can baseline the schema and drop it. After any push, verify: `SELECT conname FROM pg_constraint WHERE conname='pixel_block_no_overlap';`
