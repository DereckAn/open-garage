import { C as createAstro, c as renderSlot, d as renderTemplate, p as renderHead } from "./server_BYabhWdN.mjs";
import { t as createComponent } from "./compiler_CuWtlv9o.mjs";
//#region src/layouts/Layout.astro
createAstro("https://astro.build");
var $$Layout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Layout;
	const { title } = Astro.props;
	return renderTemplate`<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>${title}</title>${renderHead($$result)}</head><body>${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "/home/dereck/Documents/GIT/open-garage/src/layouts/Layout.astro", void 0);
//#endregion
export { $$Layout as t };
