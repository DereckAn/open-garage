import type { APIRoute } from 'astro';
import { publishLight } from '../../../lib/emqx';

// Known light ids — guards against publishing to an arbitrary topic.
const LIGHTS = new Set(['1', '2']);

// Body: {"on": true|false}
export const POST: APIRoute = async ({ params, request, locals }) => {
  const id = params.id!;
  if (!LIGHTS.has(id)) return new Response('unknown light', { status: 404 });
  const { on } = await request.json().catch(() => ({}));
  if (typeof on !== 'boolean') return new Response('body must be {"on": boolean}', { status: 400 });

  const user = await locals.currentUser();
  const by = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? user?.id ?? 'unknown';

  try {
    await publishLight(id, on, by);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
};
