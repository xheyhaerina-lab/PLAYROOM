# PLAYROOM — Social Gaming SaaS Platform

PLAYROOM is a full-stack bilingual (English & French) social gaming SaaS platform built with React, TypeScript, Tailwind CSS, Express, WebSockets, PWA support, Supabase PostgreSQL migrations, and a provider-independent international Merchant of Record (MoR) billing architecture in USD.

## Implemented Features

- **Public Pages**: Landing page (`/`), Login (`/login`), Registration (`/register`), Forgot/Reset Password (`/forgot-password`, `/reset-password`), International USD Pricing (`/pricing`), Terms (`/terms`), Privacy (`/privacy`).
- **Four Playable Games (Server-Validated)**:
  1. **Quiz Battle** (`/games/quiz-battle`): 7 categories, 3 difficulties, live countdown timers, keyboard shortcuts (`1–4`), server-side answer reveal & speed bonuses.
  2. **Word Challenge** (`/games/word-challenge`): Interactive word decoding grid, virtual & physical keyboard, hints, and UTC daily word mode.
  3. **Brain Test** (`/games/brain-test`): Number sequences, pattern matrices, math reasoning, timed memory challenges, and logic puzzles.
  4. **Mystery Room** (`/games/mystery-room`): Multi-stage detective cases with interactive clue inspection, suspect alibi comparison, and deduction verification.
- **Real-Time Multiplayer** (`/multiplayer`, `/multiplayer/create`, `/multiplayer/join`, `/multiplayer/room/:code`): WebSocket-powered rooms with 6-character codes, public/private visibility, Free vs PLUS limits, ready toggles, host start, live scoreboard, duplicate-submission protection, and rematch.
- **Gamification & Social**: XP & Level progression, 7 achievements, UTC Daily Challenges (`/challenges`), Daily/Weekly/Monthly/All-time Leaderboards (`/leaderboards`), Friends & requests (`/friends`), Notifications (`/notifications`), and player moderation reporting.
- **International USD Billing & Subscriptions** (`/subscription`):
  - **FREE**: `$0/month` (`0` cents)
  - **PLAYROOM PLUS**: `$4.99/month` (`499` integer cents)
  - **PLAYROOM PLUS YEARLY**: `$39.99/year` (`3999` integer cents)
  - Monetary values are stored and calculated strictly as integer cents (`USD` default) with zero floating-point arithmetic.
- **Protected Administration Console** (`/admin`): Platform metrics, user search & suspension, Quiz Battle question bank CRUD, configurable integer-cent plan pricing, payment logs, and moderation report resolution.
- **Installable PWA**: Configured via `vite-plugin-pwa` with PNG icons (`192x192`, `512x512`, maskable, `180x180` Apple touch icon), offline connectivity indicator, and in-app install prompt.

---

## Merchant of Record (MoR) Evaluation & Payment Architecture

PLAYROOM uses a provider-independent `PaymentProviderAdapter` contract (`server/payments/types.ts`) so billing operations (checkout sessions, payment verification, recurring renewals, cancellations, failed payments, and idempotent webhook verification) remain decoupled from any single processor.

### Provider Evaluation: Paddle Billing vs. Dodo Payments

| Criteria | Paddle Billing | Dodo Payments (Selected Primary Adapter) |
| --- | --- | --- |
| **Model** | Merchant of Record (global tax/VAT compliance) | Merchant of Record (220+ countries, global tax compliance) |
| **USD & International Cards** | Supported (`USD` integer cents strings) | Supported (`USD` integer cents, international cards & local wallets) |
| **Recurring Subscriptions** | Monthly & Annual supported | Monthly & Annual supported (`PATCH /subscriptions/{id}`) |
| **Seller Payouts & Eligibility** | Selective onboarding review for consumer gaming & stricter supported payout countries | Broad international founder/seller payout eligibility across emerging & developed markets |
| **Webhook Verification** | Custom `Paddle-Signature` (`ts` + `h1` HMAC) | Open **Standard Webhooks** spec (`webhook-id`, `webhook-timestamp`, `webhook-signature`, `whsec_` base64) |

**Selection**: `DodoPaymentsAdapter` (`server/payments/dodo.ts`) is implemented as the primary adapter against official Dodo Payments REST APIs (`POST /checkouts`, `GET /checkouts/{id}`, `GET /payments/{id}`, `PATCH /subscriptions/{id}`) and Standard Webhooks verification. Neither provider is assumed approved until merchant onboarding is completed and live credentials are supplied.

### Security & Integrity Guarantees
- Premium access is **never** granted from frontend return URLs or success messages.
- All subscriptions activate only after server-side checkout/payment verification or cryptographically verified webhook events (`payment.succeeded`, `subscription.active`, `subscription.renewed`) matching expected `amountCents` and `currency`.
- Duplicate webhook deliveries are ignored idempotently via `event_id` tracking (`webhook_events` table / `processedWebhookEvents` set).
- Failed payments (`payment.failed`, `subscription.past_due`) and cancellations/expirations (`subscription.cancelled`, `subscription.expired`) update subscription state and notify the player.

---

## Local Installation

```bash
npm install
cp .env.example .env
npm run dev
```

The server starts on `http://localhost:3000` (Express API + WebSockets on `/ws` + Vite middleware).

---

## Supabase Configuration

1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_seed_data.sql`
3. In **Authentication → Providers**, enable Email/Password (and optionally Google OAuth with your Client ID & Secret).
4. Add your Supabase keys to `.env`:
   - Public (safe for browser): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Private (server-only, never prefix with `VITE_`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Payment Provider Configuration (Dodo Payments)

Once your Merchant of Record account and USD subscription products (`$4.99/mo` and `$39.99/yr`) are approved in Dodo Payments, configure these private server-only variables in `.env`:

- `PAYMENT_PROVIDER="dodo_payments"`
- `DEFAULT_BILLING_CURRENCY="USD"`
- `DODO_PAYMENTS_ENV="test_mode"` (switch to `"live_mode"` in production)
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_SECRET` (`whsec_...`)
- `DODO_PRODUCT_PLUS_MONTHLY_ID` (`pdt_...` for `$4.99/month`)
- `DODO_PRODUCT_PLUS_ANNUAL_ID` (`pdt_...` for `$39.99/year`)
- Configure your Dodo Payments webhook endpoint to `${APP_URL}/api/webhooks/payments`.

When these variables are absent, PLAYROOM starts cleanly in safe unconfigured mode and blocks subscription activation instead of simulating payments.

---

## Vercel Deployment

1. Push this repository to GitHub/GitLab.
2. Import the project into **Vercel**.
3. Configure all environment variables from `.env.example` in Vercel **Project Settings → Environment Variables** (keep `SUPABASE_SERVICE_ROLE_KEY` and all `DODO_*` variables server-only).
4. Build command: `npm run build`
5. Note: For persistent real-time WebSockets across serverless cold starts on Vercel, pair with **Supabase Realtime** channels using the provisioned `rooms` / `room_players` / `game_sessions` tables, or deploy the Node `server.ts` process on a WebSocket-capable host (Cloud Run, Railway, Fly.io, Render).

---

## Testing & Verification

```bash
npm run lint     # TypeScript type check
npm run test     # Vitest unit & integration suite
npm run build    # Production Vite + PWA bundle
```
