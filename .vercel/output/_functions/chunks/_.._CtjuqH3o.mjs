import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_BYabhWdN.mjs";
import { t as createComponent } from "./compiler_CuWtlv9o.mjs";
import { t as $$Layout } from "./Layout_9EHuyJgB.mjs";
import { t as $$InternalUIComponentRenderer } from "./InternalUIComponentRenderer_DMIs9RDH.mjs";
//#region node_modules/@clerk/astro/components/interactive/SignIn.astro
createAstro("https://astro.build");
var $$SignIn = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$SignIn;
	return renderTemplate`${renderComponent($$result, "InternalUIComponentRenderer", $$InternalUIComponentRenderer, {
		...Astro.props,
		"component": "sign-in"
	})}`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/SignIn.astro", void 0);
//#endregion
//#region src/pages/sign-in/[...index].astro
var ____index__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Component,
	file: () => $$file,
	url: () => $$url
});
var $$Component = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Iniciar sesión" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<main class="grid min-h-screen place-items-center bg-slate-950 p-6">${renderComponent($$result, "SignIn", $$SignIn, {})}</main>` })}`;
}, "/home/dereck/Documents/GIT/open-garage/src/pages/sign-in/[...index].astro", void 0);
var $$file = "/home/dereck/Documents/GIT/open-garage/src/pages/sign-in/[...index].astro";
var $$url = "/sign-in/[...index]";
//#endregion
//#region \0virtual:astro:page:src/pages/sign-in/[...index]@_@astro
var page = () => ____index__exports;
//#endregion
export { page };
