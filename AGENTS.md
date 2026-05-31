# Agent guide — CSoT'26 site

Registration site for CAIC Summer of Tech 2026 at IIT Delhi. Live at `csot.devclub.in`. Read [`PRODUCT.md`](PRODUCT.md) for tone, [`DESIGN.md`](DESIGN.md) for visual system, [`README.md`](README.md) for setup.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack at a glance

- **Next.js 16** App Router, React 19, TypeScript strict.
- **Auth.js v5 (beta)** with a custom OIDC provider for `auth.devclub.in`. Custom `customFetch` rewrites the discovery URL (their well-known is under `/api/oauth/`, not the issuer root).
- **Supabase** Postgres. Two tables (`csot_users`, `csot_registrations`), RLS-enabled with **no policies** — all access goes through Server Actions using the service-role key.
- **Tailwind v4** with custom OKLCH tokens in `src/app/globals.css`. No component library: shadcn-style primitives written inline.
- **Zod** + **React Hook Form** for every form. Server actions re-validate with the same schemas (`src/lib/validations.ts`).

## File map (only the load-bearing bits)

```
src/
  auth.ts                       # NextAuth config; signIn does NOT write to DB
  proxy.ts                      # Auth + onboarding gate (Next.js 16 calls it proxy, not middleware)
  app/
    page.tsx                    # Landing
    onboarding/page.tsx         # Mandatory first-run; read-only after first track registration
    dashboard/page.tsx          # User registrations (view-only links for registered tracks)
    tracks/[slug]/register/page.tsx
    tracks/[slug]/leaderboard/page.tsx  # Public live leaderboard (rank/name/hostel)
    tracks/[slug]/leaderboard/edit/page.tsx  # Track-lead editor (rank + entry only)
    signin/page.tsx
    actions/
      onboarding.ts             # completeOnboarding — the ONLY place csot_users is written
      registrations.ts          # registerForTrack, withdrawFromTrack
      leaderboard-editor.ts       # Editor login/load/save for DB-backed leaderboards
    api/auth/[...nextauth]/route.ts
  components/
    onboarding-form.tsx
    registration-form.tsx       # Per-track questions only; hostel/year/phone live on the user
    hostel-select.tsx           # Custom listbox combobox (native <select> popup is unstylable)
    club-logo.tsx               # ClubLogo, ClubLogoStack
    track-card.tsx
    leaderboard-menu.tsx        # Client dropdown in SiteNav listing tracks → /tracks/<slug>/leaderboard
    leaderboard-editor.tsx      # Client editor UI (prompt login, rank/entry table)
    site-nav.tsx, site-footer.tsx, withdraw-button.tsx
  lib/
    leaderboard-editor/         # credentials.ts, session.ts, resolve-users.ts
    tracks.ts                   # Canonical track catalogue (in code, not DB)
    clubs.ts                    # Club key → display name + logo asset
    hostels.ts                  # HOSTELS list incl. "Day scholar"
    validations.ts              # onboardingInput, registrationInput, ENTRY_YEARS
    year-from-entry.ts          # Extract entry year from "2024MT60685"
    leaderboards/               # Per-track leaderboard source registry; sources/ holds live wirings
    supabase/server.ts          # Server-only client using SUPABASE_SERVICE_ROLE_KEY
    utils.ts                    # cn()
  types/next-auth.d.ts          # Augments Session / JWT
whatsapp-groups.txt             # Organiser reference: track name → WhatsApp invite URL (copy into tracks.ts)
leaderboard-editor-credentials.txt  # Plaintext editor logins (gitignored); regenerate with scripts/generate-leaderboard-credentials.mjs
supabase/migrations/            # 0001 init … 0005 leaderboard_entries
```

## Conventions

- **Never write to `csot_users` outside `completeOnboarding`.** The Auth.js `signIn` callback is intentionally a no-op so visitors who bounce off OAuth do not leave ghost rows.
- **Onboarding gate is enforced by `src/proxy.ts`.** `session.user.id` is set only when a `csot_users` row exists; protected routes (`/dashboard`, `/tracks/*/register`) bounce to `/onboarding?next=…` when it is missing.
- **Hostel / entry year / phone are user-level**, not per-registration. Registration form pulls them from `session.user.*` and renders a read-only "On file" panel. Profile fields can be edited on `/onboarding` only **before** the user's first track registration; after that, onboarding and the registration form show read-only profile data (server action rejects updates too).
- **Registrations are write-once.** `registerForTrack` inserts a row; it does not upsert. Registered users see a confirmation + read-only responses on `/tracks/[slug]/register` — no edit form. `withdrawFromTrack` still works; withdrawing the last registration unlocks profile editing again.
- **All DB writes through Server Actions.** Never import `getSupabase()` into a client component. The service-role key bypasses RLS — keep it server-only.
- **Validate twice.** Every server action re-runs `schema.safeParse(raw)` even when the form already validated; never trust client-shaped inputs.
- **Track catalogue is in code** (`src/lib/tracks.ts`). Each `Track` has `slug`, `name`, `clubs`, `tagline`, `about`, `status`, and optional `trackUrl` / `platformUrl` / `whatsappUrl`. To add a track, append to `TRACKS` and add any new club keys to `clubs.ts` with a logo under `public/clubs/` (CAIC assets: `https://caic.iitd.ac.in/static/images/clubs/` or `…/societies/`). The landing page, dashboard, and Zod `trackSlugs()` pick up changes automatically — no DB migration for new tracks (`track_slug` is plain `text`).
- **Track register sidebar** (`/tracks/[slug]/register`) shows club logos, name, tagline, and `about` only — no outcomes or bullet lists.
- **Track count on the landing page and in layout metadata** is derived from `listTracks().length`; do not hardcode a number in copy.
- **Per-track post-registration links** (`trackUrl`, `platformUrl`, `whatsappUrl`) are optional fields on `Track`, gated behind registration. They only appear on `/tracks/[slug]/register` after the user has registered and on `/dashboard` next to each registered row — never on public pages.
  - `trackUrl` powers a primary **Launch track** button (typically the track's GitHub repo / syllabus). When unset it renders as a disabled placeholder so the layout stays stable.
  - `platformUrl` powers a secondary **Launch platform** button for tracks with a dedicated platform (e.g. `csot-low-latency.devclub.in`, `csot-devops.devclub.in`). Tracks without a platform simply omit the button — no placeholder.
  - `whatsappUrl` powers a "Join WhatsApp group" button; when unset it renders as a disabled placeholder ("WhatsApp soon"). Organisers maintain invite links in `whatsapp-groups.txt` at the repo root; copy the matching URL onto each track's `whatsappUrl` in `tracks.ts`, then redeploy — there is no admin UI.
- **TBA tracks** (`status: "tba"`) look like other tracks on the landing page and track detail sidebar — logos, full opacity, tagline, and about — but with no register CTA on the card, no registration form on `/tracks/[slug]/register` (sidebar only when not already registered), and **no leaderboard** (excluded from the nav dropdown; `/tracks/[slug]/leaderboard` 404s). `registerForTrack` rejects them server-side (`track.status !== "open"`). They are excluded from the dashboard "Explore more" list. **Currently TBA:** `autonomous-control-system` (AeroClub), `robotics`.
- **Open tracks still missing `trackUrl`** (show a disabled "Launch track" placeholder after registration): `quant`, `ml-in-proteins`. Add repos to `tracks.ts` as organisers publish them.
- **Design tokens live in `globals.css`.** Use `bg-cream`, `text-ink`, `text-ink-soft`, `border-rule`, `text-accent-deep`, `bg-accent-soft`, `text-warn`, `text-success`. Don't introduce raw hex; add a token instead.
- **Typography**: `font-mono` for caps/meta (`text-meta uppercase tracking-[0.16em]`), `serif` (Fraunces) for display, default sans (Geist) for body.
- **No identical card grids.** Track cards already use a rhythm (`isLead = index % 3 === 0`). Anti-references in `PRODUCT.md` are hard nos — no neon accents, no Y-Combinator cream-and-serif, no stock photos.
- **Leaderboards live in `src/lib/leaderboards/`** as a discriminated-union registry (`LEADERBOARDS`) keyed by track slug. Every track slug must have an entry; default is `{ kind: "coming-soon" }`. To wire a real source, drop a file under `src/lib/leaderboards/sources/<slug>.ts` exporting the data or fetcher, then add it to the `OVERRIDES` map at the top of `index.ts` as `{ kind: "hardcoded", entries }` or `{ kind: "api", fetch }`. `getLeaderboard(slug)` normalises and sorts; API fetch errors degrade to a coming-soon panel with the error note (the page never throws).
- **Leaderboard column contract is exactly `rank`, `name`, `hostel`.** Sources are responsible for resolving hostel themselves. The canonical pattern for API sources that only know an entry number: fetch the upstream rows, collect the entry numbers, `select("entry_number, hostel").in("entry_number", ...)` on `csot_users`, and substitute `"—"` for participants who never onboarded here. See `src/lib/leaderboards/sources/low-latency.ts` for the reference implementation. Hardcoded sources include the hostel string verbatim.
- **Leaderboard route is public.** `/tracks/[slug]/leaderboard` is intentionally outside the `src/proxy.ts` matcher so unauthenticated viewers (and the nav dropdown) can see standings. The page sets `revalidate = 60`; API sources should additionally pass `next: { revalidate: 60 }` to `fetch()` so the upstream call is cached at the data layer.
- **Leaderboard editor** at `/tracks/[slug]/leaderboard/edit` for open tracks in `EDITABLE_LEADERBOARD_SLUGS` ([`src/lib/leaderboard-editor/credentials.ts`](src/lib/leaderboard-editor/credentials.ts)). **Excluded:** `devops`, `low-latency`, `cybersec` (low-latency keeps its API override). Auth is per-track username/password via browser `prompt()` — no DevClub OAuth, no public nav link. Session is an httpOnly signed cookie (`csot_lb_editor`). Rows stored in `csot_leaderboard_entries` as `rank` + `entry_number`; name/hostel resolved from `csot_users` on read. Public leaderboard for editable tracks uses `{ kind: "db" }` unless overridden in `OVERRIDES`. Regenerate plaintext creds: `node scripts/generate-leaderboard-credentials.mjs` → `leaderboard-editor-credentials.txt` (gitignored; distribute to track leads manually).

## Database rules

- **Never drop, truncate, or destructively alter without explicit user confirmation in the same turn.** The user's standing instruction: ask first, always.
- New schema goes in `supabase/migrations/000X_<snake_case>.sql` and is applied through the Supabase MCP `apply_migration` tool (not via `execute_sql`).
- Project id: `mbazfoxcruoacstnhwdh` (org `itxprashant`). Service-role key lives in `/etc/csot-site/env` on the VM and `.env.local` in dev.

## Auth specifics

- DevClub OIDC discovery is at `https://auth.devclub.in/api/oauth/.well-known/openid-configuration`. Auth.js v5 derives `${issuer}/.well-known/openid-configuration` and ignores `wellKnown` — the `[customFetch]` interceptor in `auth.ts` rewrites the request. Do not "fix" this by changing the issuer URL.
- Profile claims used: `kerberos`, `entry_number`, `department`, `phone`, plus the standard `name`/`email`/`picture`. `kerberos` is the unique key on `csot_users`.
- JWT callback does a single DB lookup per request **only while `token.csotUserId` is unset** (i.e., until onboarding completes). After that the token is warm.
- Do not surface "Kerberos" anywhere in the UI; it's an internal identifier only.

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                   # http://localhost:3000
npm run lint                  # eslint
npx tsc --noEmit              # typecheck
npm run build                 # production build
```

Local OAuth: register `http://localhost:3000/api/auth/callback/devclub` as an extra redirect URI in the DevClub developer portal, or use a tunnel.

## Deployment

**Always deploy after making a change** — run the deploy below before considering the task done, unless the user explicitly says not to. Verify `systemctl is-active csot-site` and spot-check `https://csot.devclub.in`.

Azure VM at `20.244.42.13`, SSH alias `csot-vm`. Service:

- App lives at `/opt/csot-site` owned by `csot-site` user.
- `systemctl {status,restart} csot-site` (Node process bound to a private port, behind nginx).
- Env file: `/etc/csot-site/env` (sourced by the systemd unit; root-only).
- Nginx vhost terminates TLS for `csot.devclub.in` via Certbot, proxies to the app port. Other vhosts on the same box must not be touched.
- Deploy pattern: rsync the project (exclude `node_modules`, `.git`, `.next`, `.env*`) into `/tmp/csot-sync/` on `csot-vm`, then `cp -a` into `/opt/csot-site/`, `chown -R csot-site:csot-site`, build, restart. Example:

```bash
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude .next \
  --exclude .env.local --exclude .env \
  ./ csot-vm:/tmp/csot-sync/

ssh csot-vm 'sudo cp -a /tmp/csot-sync/. /opt/csot-site/ \
  && sudo chown -R csot-site:csot-site /opt/csot-site \
  && sudo -u csot-site bash -c "cd /opt/csot-site && set -a && source /etc/csot-site/env && set +a && npm install --include=dev && npm run build" \
  && sudo systemctl restart csot-site && systemctl is-active csot-site'
```

  `/etc/csot-site/env` sets `NODE_ENV=production`, so plain `npm install` skips devDependencies (`@tailwindcss/postcss`, etc.) and the build fails — always use `npm install --include=dev` before `npm run build`.

## Before you commit

- Deploy to production (see **Deployment** above) after any change that should be live.
- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- New form fields: add to Zod schema → action → form component → display sites in this order.
- New protected route: extend the matcher in `src/proxy.ts` and `NEEDS_AUTH`/`NEEDS_ONBOARDING` predicates.
- Renaming a track slug: existing `csot_registrations.track_slug` rows keep the old value — add a redirect or migration if registrations already exist under the previous slug (e.g. `autopilot-crash-course` → `autonomous-control-system`).
- Never commit `.env*`. `.gitignore` already covers it.
