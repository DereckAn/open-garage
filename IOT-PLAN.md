# IoT Plan — EMQX (MQTT publish over HTTP)

## Context
Auth is done (Clerk + Google + email allowlist; all routes guarded by `src/middleware.ts`).
The door button is still a mock. Clicking it must publish a command to an **EMQX Cloud
Serverless** broker so a (future) ESP32 subscribed to the topic pulses the garage relay.
The door is a **momentary toggle, no open/closed feedback** → UI becomes a single
"Activar" action. Family of 4, one door; EMQX free tier is plenty.

## Backend: EMQX HTTP REST publish (no MQTT client)
A serverless function must not hold an MQTT session open. EMQX has a REST publish
endpoint — one `fetch`, no `mqtt.js`:
```
POST https://<host>:8443/api/v5/publish
Authorization: Basic base64(APP_ID:APP_SECRET)
{ "topic": "progreso/7a/garagedoor/1", "payload": "<json>", "qos": 1, "retain": false }
```
- Auth = Basic with EMQX **App ID / App Secret** (in `.env`).
- `*.emqxsl.com` = Let's Encrypt cert → Node `fetch` trusts it, **no CA file** for the web
  side (`emqxsl-ca.crt` is for the ESP32 only).
- Success = **200** (delivered) or **202** (`no_matching_subscribers`, ESP32 offline).
  Any 2xx = success.
- `retain: false` is mandatory — a retained toggle re-fires on every ESP32 reconnect.

## Command payload contract (robust, ESP32-facing)
```json
{ "action": "toggle", "door": "1", "requestId": "<uuid>", "ts": 1699999999000, "by": "user@email" }
```
- `requestId` (`crypto.randomUUID()`) → ESP32 ignores duplicate ids (kills QoS-1 double-toggle).
- `ts` (`Date.now()`) → ESP32 rejects commands older than ~30s (replay/staleness).
- `action` → `toggle` now; room for `open`/`close`/`stop` later.
- `by` → audit (from Clerk `currentUser()`).

Web app only *sends* these. Dedup + staleness enforcement is ESP32 firmware (out of scope).

## Steps
- [x] **1. `.env`** — `EMQX_HOST`, `EMQX_APP_ID`, `EMQX_APP_SECRET`; mirrored in `.env.example`.
- [x] **2. `src/lib/emqx.ts`** — `publishDoor(id, by)`: payload, Basic-auth POST to
      `/api/v5/publish`, 5s timeout, throw on non-2xx.
- [x] **3. `src/pages/api/door/[id].ts`** — guarded `POST`; door-id Set guard; email from
      `locals.currentUser()`; publish.
- [x] **4. `src/pages/index.astro`** — one door `{id:'1'}`; toggle-only UI; "Activar puerta"
      → `POST /api/door/1` with in-flight + "Enviado ✓"/"Error".

## Verification
1. `.env` has the 3 EMQX vars; `bun dev`.
2. Signed-in allowed user → click Activar → "Enviado ✓"; `POST /api/door/1` → `{ok:true}`.
3. EMQX console: subscribe to `progreso/7a/garagedoor/1`, confirm JSON arrives qos1/retain false.
4. Signed-out POST → blocked by middleware. Unknown id → 404.
5. `bunx astro build` succeeds.

## Out of scope (next)
ESP32 firmware: subscribe over MQTT/TLS (8883, `emqxsl-ca.crt`), dedup `requestId`, check
`ts`, pulse relay on `toggle`. Optional: status topic `.../1/state` for real feedback.
