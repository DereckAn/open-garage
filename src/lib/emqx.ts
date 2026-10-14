// Publishes one door command to EMQX via its HTTP REST API (no persistent MQTT session).
// Topic: progreso/7a/garagedoor/<id>. qos 1, retain false (a retained toggle would
// re-fire on every ESP32 reconnect). 200 = delivered, 202 = no subscriber → door offline, error.

const env = (k: string) => import.meta.env[k] ?? process.env[k];

export async function publishDoor(id: string, by: string) {
  const host = env('EMQX_HOST');
  const auth = Buffer.from(`${env('EMQX_APP_ID')}:${env('EMQX_APP_SECRET')}`).toString('base64');

  const payload = JSON.stringify({
    action: 'toggle',
    door: id,
    requestId: crypto.randomUUID(), // ESP32 dedups on this → no QoS-1 double-toggle
    ts: Date.now(),                 // ESP32 rejects stale commands → replay protection
    by,
  });

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 5000); // don't hang the function
  try {
    const res = await fetch(`https://${host}:8443/api/v5/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ topic: `progreso/7a/garagedoor/${id}`, payload, qos: 1, retain: false }),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`EMQX publish failed: ${res.status} ${await res.text()}`);
    if (res.status === 202) throw new Error('garage door offline (no subscriber)');
  } finally {
    clearTimeout(timer);
  }
}
