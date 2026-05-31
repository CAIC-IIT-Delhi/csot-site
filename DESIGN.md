# CSoT'2026 — Design system

## Theme decision

Scene sentence: *A first-year at IIT Delhi, just back in hostel for the summer term, sitting at a wooden table in a bright common room at 11am, scrolling the page on a laptop, slightly nervous about whether they're "tech enough" to sign up, wanting permission to try something new.*

That forces **light**. Bright common room, daylight, table — dark mode would feel wrong, like a different setting. Warm tinted neutrals carry the daylight feeling without going stark.

## Color strategy

**Committed** — one saturated colour carries roughly 35% of the surface (the inked text, the register CTAs, the active-track emphasis, the wordmark). Not Restrained, because the page needs to feel like an *invitation*, not a Notion doc.

All values in OKLCH, tinted toward a warm hue (~50° hue, somewhere between amber and terracotta). Avoid both `#000` and `#fff`.

| Token              | OKLCH                  | Role                                                     |
| ------------------ | ---------------------- | -------------------------------------------------------- |
| `--cream`          | `oklch(98% 0.012 65)`  | Page background. Very pale warm.                         |
| `--paper`          | `oklch(96% 0.018 65)`  | Slightly inset surfaces, form fields, code blocks.       |
| `--ink`            | `oklch(22% 0.04 50)`   | Body text, headings, wordmark. Deep tinted ink, not #000.|
| `--ink-soft`       | `oklch(45% 0.03 55)`   | Secondary text, captions, meta.                          |
| `--rule`           | `oklch(88% 0.015 60)`  | Hairlines, dividers, card outlines.                      |
| `--accent`         | `oklch(58% 0.17 38)`   | The committed colour. Burnt-terracotta. CTAs, focus.     |
| `--accent-soft`    | `oklch(92% 0.05 40)`   | Accent-tinted backgrounds (badges, hover states).        |
| `--accent-deep`    | `oklch(45% 0.18 35)`   | Pressed state, accent text on cream.                     |
| `--success`        | `oklch(58% 0.13 145)`  | "Registered" confirmation. Used sparingly.               |
| `--muted-warn`     | `oklch(70% 0.10 80)`   | "Coming soon" / Game Dev TBA badge. Not red, not yellow. |

Reflex-rejection check:
- First-order would have been "tech program → blue/navy with white". Rejected.
- Second-order would have been "warm cream + terminal green" or "Y-combinator orange on cream". Rejected — the accent is **terracotta**, materially different from YC's flat orange, and the surface isn't cream-and-black.

## Typography

- **Display + headings**: Fraunces (Google Fonts), weight 500 with optical-size 144, slight negative tracking. Carries the editorial register without going generic-serif.
- **Body and UI**: Geist Sans (already installed), 400 / 500 / 600.
- **Mono**: Geist Mono. Reserved for the wordmark suffix `'26`, kerberos IDs, code snippets in DESIGN docs.

Scale (≥1.25 ratio enforced):

| Step        | Size  | Use                                  |
| ----------- | ----- | ------------------------------------ |
| display     | 72px  | Wordmark on landing                  |
| h1          | 48px  | Section openers                      |
| h2          | 32px  | Track page name                      |
| h3          | 22px  | Card title                           |
| body-lg     | 18px  | Lede paragraphs                      |
| body        | 16px  | Body, form labels                    |
| meta        | 13px  | Captions, club tags, helper text     |

Cap body line length at 68ch.

## Layout

- Page max-width 1180px, comfortable side gutters (clamp 24px → 64px).
- The landing has a *rhythm*: 96px between major sections, 24px–48px within sections, intentionally inconsistent. Not a Bootstrap stack of equal-height blocks.
- Track grid: 2-column on tablet, 3-column on desktop, BUT cards are not identikit — the first card in each row is given an extra emphasis (slightly more padding, accent rule on top) so the eye actually moves down the page. No identical-card-grid anti-pattern.
- Form (product register): single-column, max 560px, generous vertical rhythm.

## Cards (track cards)

A card is a *real card*: hairline rule on `--rule`, generous padding (28px). Three things on it, in this order:
1. Tag row — the club(s) typed in `--accent-deep`, small caps, monospace-feeling — this signals "who runs this".
2. Track name — h3 in Fraunces.
3. One-line tagline — body, `--ink-soft`.

Plus a register button bottom-right. For `status: "tba"` (Game Dev) the card body is dimmed to ~70% opacity, the button is replaced with the text "Club TBA · opening soon" in `--muted-warn`.

No icons. No illustrations. The typography contrast does the differentiation.

## Motion

- Card hover: 120ms ease-out-quart, lift `translateY(-2px)`, rule colour shifts toward `--accent-soft`. No shadow puffs.
- Page transitions: none beyond Next.js default.
- Focus ring: 2px `--accent` offset 2px, always visible — no `outline: none`.

## Anti-patterns (re-listed for this project)

- No side-stripe borders.
- No gradient text on the wordmark.
- No glassmorphism.
- No big-number / supporting-stats hero block.
- No modal for registration. Use a route.
- No em dashes — commas, colons, semicolons, periods, parentheses only. (This applies to UI copy. Source code and these docs are allowed em dashes where helpful.)
