import { C as createAstro, d as renderTemplate, f as maybeRenderHead, h as defineScriptVars, m as addAttribute } from "./server_BYabhWdN.mjs";
import { t as createComponent } from "./compiler_CuWtlv9o.mjs";
import { t as generateSafeId } from "./internal_DxJB5Eah.mjs";
//#region node_modules/@clerk/astro/components/interactive/InternalUIComponentRenderer.astro
createAstro("https://astro.build");
var $$InternalUIComponentRenderer = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$InternalUIComponentRenderer;
	const { component, id, ...props } = Astro.props;
	const safeId = id || generateSafeId();
	return renderTemplate`${maybeRenderHead($$result)}<div${addAttribute(`clerk-${component}-${safeId}`, "data-clerk-id")}></div><script>(function(){${defineScriptVars({
		props,
		component,
		safeId
	})}
  /**
   * Store the id and the props for the Astro component in order to mount the correct UI component once clerk is loaded.
   * The above is handled by \`mountAllClerkAstroJSComponents\`.
   */
  const setOrCreatePropMap = ({ category, id, props }) => {
    if (!window.__astro_clerk_component_props) {
      window.__astro_clerk_component_props = new Map();
    }

    if (!window.__astro_clerk_component_props.has(category)) {
      const _ = new Map();
      _.set(id, props);
      window.__astro_clerk_component_props.set(category, _);
    }

    window.__astro_clerk_component_props.get(category)?.set(id, props);
  };

  setOrCreatePropMap({
    category: component,
    id: \`clerk-\${component}-\${safeId}\`,
    props,
  });
})();<\/script>`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/InternalUIComponentRenderer.astro", void 0);
//#endregion
export { $$InternalUIComponentRenderer as t };
