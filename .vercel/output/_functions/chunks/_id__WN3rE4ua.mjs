import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
//#region src/lib/emqx.ts
var env = (k) => Object.assign({
	"ASSETS_PREFIX": void 0,
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_YnJpZ2h0LW9jdG9wdXMtNTYxMS5jbGVyay5hY2NvdW50cy5kZXYk",
	"SITE": void 0,
	"SSR": true
}, {
	EMQX_APP_ID: "m3111f99",
	EMQX_APP_SECRET: "K.4kY8ddI5oi-kGG",
	EMQX_HOST: "jc748298.ala.us-east-1.emqxsl.com",
	_: "/home/dereck/.bun/bin/bunx"
})[k] ?? process.env[k];
async function publishDoor(id, by) {
	const host = env("EMQX_HOST");
	const auth = Buffer.from(`${env("EMQX_APP_ID")}:${env("EMQX_APP_SECRET")}`).toString("base64");
	const payload = JSON.stringify({
		action: "toggle",
		door: id,
		requestId: crypto.randomUUID(),
		ts: Date.now(),
		by
	});
	const ctl = new AbortController();
	const timer = setTimeout(() => ctl.abort(), 5e3);
	try {
		const res = await fetch(`https://${host}:8443/api/v5/publish`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${auth}`
			},
			body: JSON.stringify({
				topic: `progreso/7a/garagedoor/${id}`,
				payload,
				qos: 1,
				retain: false
			}),
			signal: ctl.signal
		});
		if (!res.ok) throw new Error(`EMQX publish failed: ${res.status} ${await res.text()}`);
	} finally {
		clearTimeout(timer);
	}
}
//#endregion
//#region src/pages/api/door/[id].ts
var _id__exports = /* @__PURE__ */ __exportAll({ POST: () => POST });
var DOORS = /* @__PURE__ */ new Set(["1"]);
var POST = async ({ params, locals }) => {
	const id = params.id;
	if (!DOORS.has(id)) return new Response("unknown door", { status: 404 });
	const by = (await locals.currentUser())?.primaryEmailAddress?.emailAddress ?? "unknown";
	try {
		await publishDoor(id, by);
		return Response.json({ ok: true });
	} catch (e) {
		return Response.json({
			ok: false,
			error: String(e)
		}, { status: 502 });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/door/[id]@_@ts
var page = () => _id__exports;
//#endregion
export { page };
