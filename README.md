# CSoT'26 — CAIC Summer of Tech

Registration site for the 2026 edition of CAIC Summer of Tech at IIT Delhi.

- Frontend & backend: Next.js 16 (App Router, React 19), TypeScript, Tailwind v4.
- Auth: Auth.js v5 with a custom OIDC provider against DevClub IITD. No other login methods.
- Data: Supabase (Postgres). Two tables, both RLS-enabled (`csot_users`, `csot_registrations`).
- Design: built against the impeccable design skill. See [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) for the design system and tone notes.

## Setup

```bash
cp .env.example .env.local   # then fill in values
npm install
npm run dev
```

Required env vars (see `.env.example` for full descriptions):

| Variable                       | Where to get it                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `AUTH_SECRET`                  | `npx auth secret` or `openssl rand -base64 32`                                   |
| `AUTH_URL`                     | `http://localhost:3000` in dev, your production URL in prod                      |
| `DEVCLUB_CLIENT_ID`            | `https://auth.devclub.in` developer portal (registered client)                   |
| `DEVCLUB_CLIENT_SECRET`        | same                                                                             |
| `NEXT_PUBLIC_SUPABASE_URL`     | Supabase Project Settings → API                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase Project Settings → API → **Service role** (secret, never client-side)   |

The registered DevClub redirect URIs already include `https://csot.devclub.in/api/auth/callback/devclub`, which is what Auth.js produces for a provider whose `id` is `"devclub"`. For local development you will need to register `http://localhost:3000/api/auth/callback/devclub` as an additional redirect URI on the client (or use a tunnel).

## Repository layout

```
src/app/          Routes (landing, dashboard, tracks, auth API)
src/components/   UI components
src/lib/          Tracks catalogue, validations, leaderboards, Supabase client
src/auth.ts       Auth.js config
src/proxy.ts      Auth + onboarding gate (Next.js 16 proxy)
supabase/migrations/   Postgres schema (applied via Supabase)
scripts/          Leaderboard credential generator
public/clubs/     Club logo assets
```

Agent and deployment notes: [AGENTS.md](AGENTS.md). Design system: [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md).

## Database

Schema lives in `supabase/migrations/` (project `mbazfoxcruoacstnhwdh`). Two tables, both new, namespaced with `csot_`:

- `csot_users` — one row per signed-in IIT Delhi user (`kerberos` is the unique key).
- `csot_registrations` — one row per `(user, track)`, with a `unique (user_id, track_slug)` constraint so re-submits update in place.

Both tables have RLS enabled with no policies; the app reads and writes them via the service-role key from Server Actions only. No browser code ever sees the service key.

The track catalogue (`src/lib/tracks.ts`) is intentionally in code, not in the database — the set is small, fixed, and gives copywriting full version control.

## Routes

| Route                          | What it does                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `/`                            | Landing page: hero, four-pillar "what to expect", 14-track grid.               |
| `/tracks/[slug]/register`      | Per-track context + registration form. Edit-in-place if already registered.    |
| `/dashboard`                   | The user's registrations with quick edit, plus links to remaining open tracks. |
| `/signin`                      | Single CTA to start the DevClub OIDC flow.                                     |
| `/api/auth/[...nextauth]`      | Auth.js handler.                                                               |

The Next.js 16 Proxy (`src/proxy.ts`) protects `/dashboard` and `/tracks/:slug/register`.

## Adding track & platform links later

`src/lib/tracks.ts` has optional `trackUrl` and `platformUrl` fields per track. Both are gated behind registration — they never appear on public pages.

- `trackUrl` → primary "Launch track" button (typically the track's GitHub repo or syllabus). When unset, a disabled placeholder is shown so the layout stays stable.
- `platformUrl` → secondary "Launch platform" button for tracks with a dedicated site (e.g. `csot-low-latency.devclub.in`). Tracks without a platform simply omit the button.

Filling these in surfaces the buttons on `/tracks/[slug]/register` (after registration) and on `/dashboard`; no schema changes needed.

## Game Dev (Coming Soon)

The Game Dev track has `status: "tba"` with `clubs: ["Club TBA"]`. The card is shown but dimmed, registration is disabled, and the track page surfaces a clear "opening soon" state. Flip `status` to `"open"` and update `clubs` once the lead is confirmed.

## Operational notes

- **No destructive DB operations** are run from the app outside of `withdrawFromTrack`, which is scoped to the calling user's own row and gated behind a confirm-before-delete UI control.
- No other auth methods are supported. The sign-in page only exposes the DevClub button.

## CI/CD (GitHub Actions → Azure VM)

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push/PR to `main`:

1. **check** — `npm ci`, lint, typecheck.
2. **deploy** — on push to `main` only, rsyncs to the VM and runs the same steps as [`deploy.sh`](deploy.sh) (build on-server using `/etc/csot-site/env`, restart `csot-site`).

### One-time GitHub setup

In the repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
| ------ | ----- |
| `CSOT_SSH_PRIVATE_KEY` | Full contents of the VM SSH private key (`myvm_key.pem`) |
| `CSOT_SSH_HOST` | `20.244.42.13` |
| `CSOT_SSH_USER` | `azureuser` |

Optional variable: `CSOT_SITE_URL` (defaults to `https://csot.devclub.in` in `deploy.sh`).

The deploy job uses the `production` environment so you can add required reviewers or branch rules later.

Manual deploy from your machine still works: `./deploy.sh` (uses the `csot-vm` SSH alias).
