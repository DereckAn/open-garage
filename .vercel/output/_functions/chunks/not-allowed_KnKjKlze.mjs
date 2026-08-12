import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, a as Fragment, c as renderSlot, d as renderTemplate, f as maybeRenderHead, h as defineScriptVars, i as renderComponent, m as addAttribute, t as spreadAttributes, x as unescapeHTML } from "./server_BYabhWdN.mjs";
import { t as createComponent } from "./compiler_CuWtlv9o.mjs";
import { t as $$Layout } from "./Layout_9EHuyJgB.mjs";
import { t as generateSafeId } from "./internal_DxJB5Eah.mjs";
//#region node_modules/@clerk/astro/components/unstyled/utils.ts
/**
* This function is used when an element is passed as a default slot and we need
* to add an attribute to it so that we can reference it in a click listener.
*/
function addUnstyledAttributeToFirstTag(html, attributeValue) {
	return html.replace(/(<[^>]+)>/, `$1 data-clerk-unstyled-id="${attributeValue}">`);
}
//#endregion
//#region node_modules/@clerk/astro/components/unstyled/SignOutButton.astro
createAstro("https://astro.build");
var $$SignOutButton = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$SignOutButton;
	const safeId = generateSafeId();
	const { asChild, redirectUrl = "/", sessionId, ...elementProps } = Astro.props;
	let htmlElement = "";
	if (asChild) {
		htmlElement = await Astro.slots.render("default");
		htmlElement = addUnstyledAttributeToFirstTag(htmlElement, safeId);
	}
	return renderTemplate`${asChild ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result) => renderTemplate`${unescapeHTML(htmlElement)}` })}` : renderTemplate`${maybeRenderHead($$result)}<button${spreadAttributes(elementProps)}${addAttribute(safeId, "data-clerk-unstyled-id")}>${renderSlot($$result, $$slots["default"], renderTemplate`Sign out`)}</button>`}<script>(function(){${defineScriptVars({
		redirectUrl,
		sessionId,
		safeId
	})}
  const btn = document.querySelector(\`[data-clerk-unstyled-id="\${safeId}"]\`);

  btn.addEventListener('click', () => {
    window.Clerk.signOut({ redirectUrl, sessionId });
  });
})();<\/script>`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/unstyled/SignOutButton.astro", void 0);
//#endregion
//#region src/pages/not-allowed.astro
var not_allowed_exports = /* @__PURE__ */ __exportAll({
	default: () => $$NotAllowed,
	file: () => $$file,
	url: () => $$url
});
var $$NotAllowed = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sin acceso" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<main class="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-white"><section class="w-full max-w-sm"><div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-500/15 text-rose-400"><svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"></circle><path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round"></path></svg></div><h1 class="mt-5 text-2xl font-bold">Sin acceso</h1><p class="mt-2 text-slate-400">Tu cuenta no está autorizada para abrir esta puerta.</p>${renderComponent($$result, "SignOutButton", $$SignOutButton, { "class": "mt-6 inline-flex rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-100 ring-1 ring-white/10" }, { "default": ($$result) => renderTemplate`Cerrar sesión` })}</section></main>` })}`;
}, "/home/dereck/Documents/GIT/open-garage/src/pages/not-allowed.astro", void 0);
var $$file = "/home/dereck/Documents/GIT/open-garage/src/pages/not-allowed.astro";
var $$url = "/not-allowed";
//#endregion
//#region \0virtual:astro:page:src/pages/not-allowed@_@astro
var page = () => not_allowed_exports;
//#endregion
export { page };
