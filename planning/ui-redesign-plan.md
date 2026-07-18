# Plan: "Warm Sanctuary" UI Redesign

## Status

Foundation + home page checkpoint are **built and user-approved** on branch `feature/warm-sanctuary-ui` (tokens, `components.json` fix, deps swapped, `Card`/`Button` press-scale + mihrab corner, `motion.tsx`, `PageShell`, `AppHeader` rewrite, `MasjidCard` extraction, home page). Remaining: the welcome landing page (below), then masjid detail → brother detail → forms → auth → admin → verification.

## Public Welcome Landing Page (user-requested addition)

A public landing at `/welcome` greeting signed-out visitors with two Qur'anic ayahs about tabligh, before they reach login. Signed-in users are never slowed down — `/` still goes straight to the masjid list.

**Routing changes:**
- `src/lib/supabase/middleware.ts`: add `/welcome` to `publicPaths`; unauthenticated visitors to `/` redirect to `/welcome` (instead of `/login`); all other private paths keep redirecting to `/login` as today.
- `src/app/page.tsx`: change `if (!user) redirect('/login')` → `redirect('/welcome')`.

**New page `src/app/welcome/page.tsx`** — static server component, Warm Sanctuary styled, full-height centered single column:
1. "Rahber" wordmark (hero type scale) + the short gold rule beneath it (this page becomes the primary brand moment; login/register keep theirs too)
2. Ayah 3:110 — Arabic first (`dir="rtl" lang="ar"`, Amiri typeface, generous size/leading), then translation in Geist, then reference "(3:110)" small/muted
3. A small gold diamond divider (`◆` between two thin rules)
4. Ayah 51:55 — same treatment
5. CTAs: primary green "Sign in" → `/login`, quieter "Create an account" link → `/register`
6. Motion: one orchestrated entrance — wordmark, ayah 1, divider, ayah 2, CTAs fade-rise in sequence using the existing `StaggerList`/`StaggerItem` primitives from `src/components/shared/motion.tsx` (reduced-motion renders static, already handled).

**Arabic typeface:** Amiri via `next/font/google` (`subsets: ['arabic']`, weight 400) — the classic Naskh face used for Qur'anic typesetting, renders harakat correctly. Loaded in the welcome page module only.

**Qur'anic text accuracy note:** the user's pasted 3:110 excerpt ends at وَتُؤْمِنُونَ but their translation includes "and believe in Allah" — the Arabic is completed with بِاللّٰهِ so text and translation match. 51:55 used as provided.

**Verification:** visit `/` signed out → lands on `/welcome`, ayahs render with correct Arabic shaping/harakat at 375px; sign in from there → masjid list; signed-in visit to `/` unchanged; `npm run lint` clean.

---

## Context

Rahber's functionality (Phases 1–8) is complete and live on `main` — masjid/brother address book, visit logging, admin panel, delegated permissions. The UI itself, though, is a plain, unstyled shadcn/ui skeleton: a single green accent, no motion, no distinct visual identity. The user wants a full visual redesign that makes the app *feel* like what it's for — a calm, warm tool used during jaula — rather than a generic admin-dashboard template, plus smooth, restrained scroll/interaction motion.

Direction agreed with the user: **"Warm Sanctuary"** — evokes a masjid interior at Maghrib (warm cream walls, deep bottle-green tilework, soft gold lamplight), built as an evolution of the existing green accent rather than a rebuild. Motion uses the `motion` library (motion.dev, formerly Framer Motion) for scroll-reveal and one header behavior, kept deliberately restrained. Scope is the **entire app in one coherent pass** — auth, home, masjid/brother detail, forms, and admin — since the design tokens and shared shell are consumed everywhere already.

The home page is built and shown running on `npm run dev` **first**, as a hard approval checkpoint, before any other page is touched — the user explicitly needs to see it, not just read about it, before the rest rolls out.

---

## Design Token System

New CSS variables in `src/app/globals.css` (`:root` = light, primary target; `.dark` written now for completeness since `next-themes` is already installed, but **no theme toggle is added in this pass** — dark mode stays inert as it is today, just no longer visually broken if ever enabled later).

Light:
```
--background: 40 35% 95%        /* Sanctuary Cream, #F6F1E6 */
--foreground: 150 12% 14%       /* Sanctuary Ink, warm near-black */
--card / --popover: 40 30% 98%  /* Parchment, slightly lifted off background */
--primary: 152 45% 22%          /* Masjid Bottle-Green, deepened from current 142.1 76.2% 36.3% */
--primary-foreground: 40 35% 97%
--secondary: 140 12% 91%
--muted: 42 20% 92%             /* Muted Sage */
--accent: 42 20% 90%            /* stays neutral — see decision below */
--destructive: 6 65% 45%        /* warmed slightly off shadcn's default red */
--border / --input: 42 15% 85%
--ring: 152 45% 22%             /* matches primary — focus rings are green, not gold */
--radius: 0.75rem               /* up from 0.5rem */
--radius-arch: 2rem             /* new — signature element only, see below */
--gold: 38 42% 52%              /* Lamplight Gold, new — NOT mapped to shadcn's --accent slot */
--gold-foreground: 30 30% 12%
```
Dark (written, not wired to a toggle): background `150 15% 8%`, primary `152 40% 48%`, gold `40 55% 58%`, foreground `40 25% 92%`, card `150 14% 11%`, borders/muted around `150 10% 16–18%`.

**Key decision:** gold gets its own `gold`/`gold-foreground` pair in `tailwind.config.ts`'s color map — it is deliberately *not* wired to shadcn's `--accent` slot, because `--accent` drives every `hover:bg-accent` in `button.tsx`/`select.tsx` today; mapping gold there would turn every hover state gold app-wide, violating "used sparingly." Green stays the color of primary actions; gold is reserved for status/achievement accents only (see signature element below).

Self-check against known AI-design clichés: no serif typeface is added (see below) and no terracotta is used, which are the two defining traits of the "warm-cream-template" cliché — the risk is judged acceptable since those two specific traits are avoided and the cream/ink/muted tones all share a green undertone rather than a neutral-gray or orange system.

---

## Typography

**Geist only — no second typeface added.** A serif/display pairing was considered and rejected: pairing a serif with a warm cream background is the single highest-risk move toward a generic "AI template" look, and the app's actual content (dense address/name lists on a phone) is better served by restraint than by added "characterful" type. Geist is already loaded as a full 100–900 variable font, so hierarchy comes from weight/size alone:

- Hero title (masjid/brother name, large-title pattern): `text-[1.75rem] font-bold tracking-[-0.01em] leading-tight`
- Section heading (`CardTitle` usage): add `tracking-tight` to the existing size
- Numeric emphasis (counts, tallies): add `tabular-nums` wherever currently missing (khurooj tiles, brother counts, aamaal fraction)

---

## Signature Element — "The Mihrab Corner"

Modify `src/components/ui/card.tsx` directly (not a parallel component — shadcn's "you own this file" model means all 13 existing `Card` usages inherit it automatically):
- Top-left corner only gets a larger radius (`rounded-tl-[var(--radius-arch)]`), the other three corners keep the base `--radius` — an abstract, non-literal echo of an arch, not a literal keyhole/mosque icon.
- Add an optional `lit?: boolean` prop: when true, a thin gold hairline (`border-gold/60`) traces just that one corner. This is information-encoding, not decorative — `lit` means one consistent thing everywhere it's used: **"this record reflects active/healthy tabligh engagement."**
  - Masjid cards (home list + detail's "5 Aamaal" card): lit when aamaal is fully complete.
  - Brother cards (list + detail contact card): lit when visited within the last 30 days.
  - Everything else (Responsible Brothers, Khurooj, Ulama, Lady Taleem, admin tiles, auth cards, access-denied card): never lit — keeps it rare and meaningful.
- Bake `active:scale-[0.98] transition-transform` into `Card`'s base classes, and `active:scale-[0.97]` into `Button`'s — this is the entire "press feedback" mechanism, pure CSS, no JS/Motion needed, and works even pre-hydration.
- A second, distinct flourish (kept separate so the app doesn't have two competing signatures) appears only on `login`/`register`: a short gold rule (`h-[3px] w-8 rounded-full bg-gold`) centered under the "Rahber" wordmark.

---

## Motion — exactly two mechanisms

Install `motion` (`npm install motion`, import path `motion/react` — this is the current name/package for what used to be Framer Motion). Used for exactly two things, both routed through one new file:

`src/components/shared/motion.tsx` (`"use client"`) exports:
- `fadeRiseVariants` + `<Reveal>` — wraps `motion.div`, `initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}`; checks Motion's `useReducedMotion()` and renders a plain, unanimated `div` when true (not just zeroed durations).
- `<StaggerList>` — parent variants so list children (masjid cards, brother cards, visit history, admin tiles) cascade in one after another instead of all at once.

The `AppHeader` rewrite additionally uses `useScroll`/`useTransform` (also gated by `useReducedMotion`) for one scroll-driven behavior: on pages with a large in-flow hero `<h1>` (masjid detail, brother detail), the sticky header's own title starts hidden and fades/scales in over the first ~80px of scroll while the header's bottom border strengthens — an iOS-style large-title collapse. On pages without a hero title (home, forms, admin), the same border-strengthen effect applies but the title is always visible. One mechanism, context-dependent outcome — this is the only other Motion usage in the app.

---

## Shared Infrastructure (build first, before any page)

1. **Fix the shadcn config bug**: `components.json` — `"style": "base-nova"` → `"style": "new-york"` (compatible with the existing classic Radix+CVA components already in `src/components/ui/`; `base-nova` is a newer Base UI-based style and would scaffold incompatible components if `shadcn add` were ever run again).
2. **Remove dead/conflicting deps**: `npm uninstall @base-ui/react tw-animate-css` — `@base-ui/react` is unused by any existing `ui/` component and is only a collision risk now that the style is fixed; `tw-animate-css` is installed but never referenced anywhere (the config actually uses `tailwindcss-animate`, which stays).
3. `npm install motion`.
4. Rewrite tokens in `src/app/globals.css` (full table above) and extend `tailwind.config.ts` (`gold` color family, `arch` radius token).
5. `src/components/ui/card.tsx` — arch corner, `lit` prop, press-scale (above).
6. `src/components/ui/button.tsx` — press-scale.
7. New `src/components/shared/motion.tsx` (above).
8. New `src/components/shared/page-shell.tsx` — `PageShell({ children, className })` renders `<div className={cn("mx-auto min-h-dvh max-w-md pb-16", className)}>`, replacing the currently-duplicated wrapper in `src/app/page.tsx`, `src/app/masjids/[id]/page.tsx`, `src/app/brothers/[id]/page.tsx`, `src/app/admin/layout.tsx`, and others.
9. Rewrite `src/components/shared/app-header.tsx` in place — same props (`title`, `backHref`, `showAddBrother`, `showAdmin`) and all existing permission-gated conditionals stay unchanged, only restyled + given the scroll behavior above. Bottom border becomes a low-opacity gold hairline (`border-gold/20`) — the one every-page use of gold.
10. Extract `src/components/masjid/masjid-card.tsx` and `src/components/brother/brother-card.tsx` as real components (today these patterns are inlined into `masjid-browser.tsx` and directly into the detail page files) — needed so the new corner/`lit` logic has one source of truth instead of being hand-copied.

---

## Per-Page Notes (brief — full detail lives in the sequencing steps)

- **Home** (`src/app/page.tsx`, `masjid-browser.tsx`, new `masjid-card.tsx`): the checkpoint page. `PageShell` + `StaggerList` of `MasjidCard`s; brother-count badge becomes a green-tinted pill (matching `NiyyahBadges`' existing pattern) instead of generic gray; `lit` = full aamaal.
- **Masjid detail**: large-title pattern for the masjid name; "5 Aamaal" card is the only one that can be `lit`; `AamaalChecklist`/`UlamaCard`/`NiyyahBadges` need **no code changes** — they already consume semantic tokens and pick up the new palette automatically; brothers list moves to extracted `BrotherCard` + `StaggerList`.
- **Brother detail**: large-title pattern for the name; contact card `lit` when visited within 30 days; "Log a visit" CTA stays pure green (`variant="default"`) — gold never touches primary actions, only status.
- **Forms** (`brothers/new`, `brothers/[id]/visit`): compact header, no large-title (reserved for browse/detail pages only); `BrotherForm`'s entry→review transition wrapped in `<Reveal>`, reusing the same variants as scroll-reveal.
- **Auth**: new `src/app/(auth)/layout.tsx` centralizing the currently-duplicated centering wrapper, background swapped to `bg-background` directly; wordmark gold-rule flourish on login/register only; `verify-email` gets token/Card restyle only, no wordmark treatment.
- **Admin**: `AccessDenied` card gets the arch corner (never lit); the plain-text sub-nav in `admin/layout.tsx` is extracted into a new client component `src/components/admin/admin-nav.tsx` (needs `usePathname()` for an active-tab underline, which the layout itself can't call as an async Server Component) — all existing permission booleans passed through unchanged; admin menu tiles get a small gold dot prefix on hint text only when `pendingCount > 0`.

---

## Sequencing

1. **Foundation** — items 1–9 above (config fixes, deps, tokens, `Card`/`Button`, `motion.tsx`, `PageShell`, `AppHeader`). No page touched yet.
2. **Home page checkpoint** — extract `MasjidCard`, update `masjid-browser.tsx` and `page.tsx`. Run `npm run dev`, check at 375px and desktop, verify `prefers-reduced-motion` fallback. **Stop for explicit user approval before continuing.**
3. Masjid detail — extract `BrotherCard`, large-title, lit-aamaal card, `tabular-nums` on khurooj tiles.
4. Brother detail + visit form.
5. Add-brother form.
6. Auth (`(auth)/layout.tsx`, login/register/verify-email).
7. Admin (layout/nav, admin home, members, masjids list/new/edit/health).
8. Verification pass (below).

---

## Verification Plan

1. Click through every route at a 375px viewport: `/login`, `/register`, `/verify-email`, `/`, `/masjids/[id]`, `/brothers/[id]`, `/brothers/[id]/visit`, `/brothers/new`, `/admin`, `/admin/members`, `/admin/masjids`, `/admin/masjids/new`, `/admin/masjids/[id]/edit`, `/admin/masjids/[id]/health`.
2. Toggle `prefers-reduced-motion: reduce` in devtools; re-check home/masjid/brother detail — reveal/stagger/header effects must be fully inert with no console errors.
3. One manual dark-mode smoke check (add `class="dark"` via devtools) — confirm legible contrast, not a full pass, since no toggle ships this round.
4. `npm run lint` and `npm run build` clean (build is what catches any missed `"use client"` on files now using Motion hooks or `usePathname`).
5. Grep for stragglers: no file still hand-builds the old `mx-auto min-h-dvh max-w-md` wrapper outside `PageShell`; no leftover raw header-title styling that should've migrated.
6. Confirm `components.json` no longer says `base-nova` and `@base-ui/react`/`tw-animate-css` are gone from `package.json`.

### Critical files
- `src/app/globals.css`, `tailwind.config.ts`, `components.json`
- `src/components/ui/card.tsx`, `src/components/ui/button.tsx`
- `src/components/shared/app-header.tsx`, `src/components/shared/motion.tsx` (new), `src/components/shared/page-shell.tsx` (new)
- `src/app/page.tsx`, `src/components/masjid/masjid-browser.tsx`, `src/components/masjid/masjid-card.tsx` (new)
