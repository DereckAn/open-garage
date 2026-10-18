import type { APIRoute } from 'astro';
import { publishDoor } from '../../../lib/emqx';

// Known door ids — guards against publishing to an arbitrary topic.
const DOORS = new Set(['1']);

export const POST: APIRoute = async ({ params, locals }) => {
  const id = params.id!;
  if (!DOORS.has(id)) return new Response('unknown door', { status: 404 });

  // Middleware already enforced auth + access; invited users may have no email.
  const user = await locals.currentUser();
  const by = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? user?.id ?? 'unknown';

  try {
    await publishDoor(id, by);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
};
