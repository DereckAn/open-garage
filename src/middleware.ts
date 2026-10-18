import { clerkMiddleware } from '@clerk/astro/server';

// Public routes anyone can hit (sign-in flow, invite landing, rejection page).
const PUBLIC = [/^\/sign-in(\/|$)/, /^\/welcome$/, /^\/not-allowed$/];

// Comma-separated email env vars. ADMIN_EMAILS can open /admin and invite people.
// ALLOWED_EMAILS is the legacy allowlist; invited users get publicMetadata.allowed instead.
const emails = (raw?: string) =>
  new Set((raw ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
const ADMINS = emails(import.meta.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAILS);
const ALLOWED = emails(import.meta.env.ALLOWED_EMAILS ?? process.env.ALLOWED_EMAILS);

export const onRequest = clerkMiddleware(async (auth, context) => {
  if (PUBLIC.some((re) => re.test(context.url.pathname))) return;

  const { userId, redirectToSignIn } = auth();
  if (!userId) return redirectToSignIn();

  const user = await context.locals.currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? '';
  const isAdmin = ADMINS.has(email);
  context.locals.isAdmin = isAdmin;

  // Checked on every request, so revoking in /admin takes effect immediately.
  const allowed = isAdmin || ALLOWED.has(email) || user?.publicMetadata?.allowed === true;
  if (!allowed) return context.redirect('/not-allowed');
  if (context.url.pathname.startsWith('/admin') && !isAdmin) return context.redirect('/');
});
