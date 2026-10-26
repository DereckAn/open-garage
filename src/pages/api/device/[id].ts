import type { APIRoute } from 'astro';
import { DEVICES } from '../../../lib/devices';
import { publish } from '../../../lib/emqx';

// Doors: empty body → toggle. Lights: body {"on": true|false}.
export const POST: APIRoute = async ({ params, request, locals }) => {
  // Only registry devices — guards against publishing to an arbitrary topic.
  const device = DEVICES.find((d) => d.id === params.id);
  if (!device) return new Response('unknown device', { status: 404 });

  let action = 'toggle';
  if (device.type === 'light') {
    const { on } = await request.json().catch(() => ({}));
    if (typeof on !== 'boolean') return new Response('body must be {"on": boolean}', { status: 400 });
    action = on ? 'on' : 'off';
  }

  // Middleware already enforced auth + access; invited users may have no email.
  const user = await locals.currentUser();
  const by = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? user?.id ?? 'unknown';

  try {
    await publish(device.topic, { action, device: device.id }, by);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
};
