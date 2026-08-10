import { clerkMiddleware } from '@clerk/astro/server';

// Public routes anyone can hit (sign-in flow + the rejection page).
const PUBLIC = [/^\/sign-in(\/|$)/, /^\/not-allowed$/];

// Allowed emails come from the ALLOWED_EMAILS env var (comma-separated).
// Editing the list = one env change, no code edit. See AUTH-PLAN.md.
const rawAllowed = import.meta.env.ALLOWED_EMAILS ?? process.env.ALLOWED_EMAILS ?? '';
const ALLOWED = new Set(
  rawAllowed.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
);

export const onRequest = clerkMiddleware(async (auth, context) => {
  if (PUBLIC.some((re) => re.test(context.url.pathname))) return;

  const { userId, redirectToSignIn } = auth();
  if (!userId) return redirectToSignIn();

  const user = await context.locals.currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!email || !ALLOWED.has(email)) return context.redirect('/not-allowed');
});
