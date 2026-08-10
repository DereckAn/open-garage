# Auth Plan — Clerk (Google OAuth + email allowlist)

## Context
The garage app has a static Astro UI with mock doors and no auth. It controls a
physical garage door, so access must be locked to a few known people. Decision:
**Clerk** (hosted auth, no DB to run, prebuilt sign-in UI) with **Google** OAuth,
restricted to a **small fixed list of emails** enforced in middleware (Clerk's
dashboard allowlist needs a paid plan; the code-side `Set` is free).

Real auth needs server-side session checks, so the project moves from static to
**SSR + Vercel adapter**. `@clerk/astro` doesn't support Astro 7 yet, so we pin
**Astro 6**.

## Caveats
- `@clerk/astro` supports Astro 4.15–6, **not 7** → downgrade `astro@^7 → astro@6`.
- Project uses **bun** (`bun dev`). Install with `bun add`.
- Vercel Marketplace Clerk sets `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; Astro needs
  `PUBLIC_CLERK_PUBLISHABLE_KEY` — add it manually on Vercel.

## Steps (implement in order)

- [x] **1. Deps** — `@clerk/astro@4` supports Astro **7**, so NO downgrade. On
      `astro@7.2.4`, `@astrojs/vercel@11`, `@clerk/astro@4`.
- [x] **2. `astro.config.mjs`** — `clerk()` integration, `vercel()` adapter,
      `output: 'server'`, Tailwind vite plugin kept.
- [x] **3. `src/middleware.ts`** — protects all routes except `/sign-in`,
      `/not-allowed`; requires an allowed email from `ALLOWED_EMAILS` (v4 has no
      `createRouteMatcher`, so public paths matched via regex on `context.url.pathname`).
- [x] **4. Auth pages** — `src/pages/sign-in/[...index].astro` + `not-allowed.astro`.
- [x] **5. `src/pages/index.astro`** — `<UserButton/>` in header (replaced the dead `+` button).
- [ ] **6. YOUR turn — Clerk keys + dashboard** — create a Clerk app, enable **Google**
      social connection, paste real `PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
      into `.env`, set `ALLOWED_EMAILS`. On Vercel add the same 3 (the `PUBLIC_`-prefixed
      key manually). `.env`/`.env.example` scaffolded; build passes.

## Key code

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [clerk()],
  adapter: vercel(),
  output: 'server',
  vite: { plugins: [tailwindcss()] },
});
```

`src/middleware.ts`:
```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isPublic = createRouteMatcher(['/sign-in(.*)', '/not-allowed']);
const ALLOWED = new Set(
  (import.meta.env.ALLOWED_EMAILS ?? '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
);

export const onRequest = clerkMiddleware(async (auth, context) => {
  if (isPublic(context.request)) return;
  const { userId, redirectToSignIn } = auth();
  if (!userId) return redirectToSignIn();
  const user = await context.locals.currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!email || !ALLOWED.has(email)) return context.redirect('/not-allowed');
});
```
(Verify `auth()` shape and env access against installed `@clerk/astro` version.)

## Verification
1. `bun dev` boots without Astro 6 / adapter errors.
2. `/` unauthenticated → redirect to `/sign-in`.
3. Google login with an allowed email → dashboard, `UserButton` visible.
4. Google login with a non-listed email → `/not-allowed`.
5. Sign out → back to `/sign-in`.
6. `bun run build` succeeds (SSR output builds).

## Out of scope (next)
AWS IoT wiring — the door toggle is still mock. After auth, it will POST to a Vercel
function that publishes to AWS IoT Core.
