import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { C as createAstro, c as renderSlot, d as renderTemplate, f as maybeRenderHead, g as createRenderInstruction, h as defineScriptVars, i as renderComponent, m as addAttribute } from "./server_BYabhWdN.mjs";
import { t as createComponent } from "./compiler_CuWtlv9o.mjs";
import { t as $$Layout } from "./Layout_9EHuyJgB.mjs";
import { t as $$InternalUIComponentRenderer } from "./InternalUIComponentRenderer_DMIs9RDH.mjs";
//#region node_modules/astro/dist/runtime/server/render/script.js
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
//#endregion
//#region node_modules/@clerk/astro/components/interactive/UserButton/UserButton.astro
createAstro("https://astro.build");
var $$UserButton = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$UserButton;
	return renderTemplate`${renderComponent($$result, "InternalUIComponentRenderer", $$InternalUIComponentRenderer, {
		...Astro.props,
		"component": "user-button"
	})}${renderSlot($$result, $$slots["default"])}`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/UserButton/UserButton.astro", void 0);
//#endregion
//#region node_modules/@clerk/astro/components/interactive/UserButton/MenuItemRenderer.astro
createAstro("https://astro.build");
var $$MenuItemRenderer = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$props, $$slots);
	Astro2.self = $$MenuItemRenderer;
	const { label, href, open, clickIdentifier, parent } = Astro2.props;
	let labelIcon = "";
	if (Astro2.slots.has("label-icon")) labelIcon = await Astro2.slots.render("label-icon");
	return renderTemplate`<script>(function(){${defineScriptVars({
		label,
		href,
		open,
		clickIdentifier,
		labelIcon,
		isDevMode: false,
		parent
	})}
  const parentElement = document.currentScript.parentElement;

  // We used a web component in the \`<UserButton.MenuItems>\` component.
  const hasParentMenuItem = parentElement.tagName.toLowerCase() === 'clerk-user-button-menu-items';
  if (!hasParentMenuItem) {
    if (isDevMode) {
      throw new Error(
        \`Clerk: <UserButton.MenuItems /> component can only accept <UserButton.Action /> and <UserButton.Link /> as its children. Any other provided component will be ignored.\`,
      );
    }
  } else {
    // Get the user button map from window that we set in the \`<InternalUIComponentRenderer />\`.
    const userButtonComponentMap = window.__astro_clerk_component_props?.get('user-button');

    let userButton;
    if (parent) {
      userButton = document.querySelector(\`[data-clerk-id="clerk-user-button-\${parent}"]\`);
    } else {
      userButton = document.querySelector('[data-clerk-id^="clerk-user-button"]');
    }

    const safeId = userButton?.getAttribute('data-clerk-id');
    if (userButtonComponentMap && safeId) {
      const currentOptions = userButtonComponentMap.get(safeId);

      const reorderItemsLabels = ['manageAccount', 'signOut'];
      const isReorderItem = reorderItemsLabels.includes(label);

      let newMenuItem = {
        label,
      };

      if (!isReorderItem) {
        newMenuItem = {
          ...newMenuItem,
          mountIcon: el => {
            el.innerHTML = labelIcon;
          },
          unmountIcon: () => {
            /* What to clean up? */
          },
        };

        if (href) {
          newMenuItem.href = href;
        } else if (open) {
          newMenuItem.open = open.startsWith('/') ? open : \`/\${open}\`;
        } else if (clickIdentifier) {
          const clickEvent = new CustomEvent('clerk:menu-item-click', { detail: clickIdentifier });
          newMenuItem.onClick = () => {
            document.dispatchEvent(clickEvent);
          };
        }
      }

      userButtonComponentMap.set(safeId, {
        ...currentOptions,
        customMenuItems: [...(currentOptions?.customMenuItems ?? []), newMenuItem],
      });
    }
  }
})();<\/script>`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/UserButton/MenuItemRenderer.astro", void 0);
//#endregion
//#region node_modules/@clerk/astro/components/interactive/UserButton/UserButtonLink.astro
createAstro("https://astro.build");
var $$UserButtonLink = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$UserButtonLink;
	const { label, href, parent } = Astro.props;
	return renderTemplate`${renderComponent($$result, "MenuItemRenderer", $$MenuItemRenderer, {
		"label": label,
		"href": href,
		"parent": parent
	}, { "label-icon": ($$result) => renderTemplate`${renderSlot($$result, $$slots["label-icon"])}` })}`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/UserButton/UserButtonLink.astro", void 0);
//#endregion
//#region node_modules/@clerk/astro/components/interactive/UserButton/UserButtonAction.astro
createAstro("https://astro.build");
var $$UserButtonAction = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$UserButtonAction;
	const { label, open, clickIdentifier, parent } = Astro.props;
	return renderTemplate`${renderComponent($$result, "MenuItemRenderer", $$MenuItemRenderer, {
		"label": label,
		"open": open,
		"clickIdentifier": clickIdentifier,
		"parent": parent
	}, { "label-icon": ($$result) => renderTemplate`${renderSlot($$result, $$slots["label-icon"])}` })}`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/UserButton/UserButtonAction.astro", void 0);
//#endregion
//#region node_modules/@clerk/astro/components/interactive/UserButton/UserButtonMenuItems.astro
var $$UserButtonMenuItems = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "clerk-user-button-menu-items", "clerk-user-button-menu-items", {}, { "default": ($$result) => renderTemplate`${renderSlot($$result, $$slots["default"])}` })}${renderScript($$result, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/UserButton/UserButtonMenuItems.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/UserButton/UserButtonMenuItems.astro", void 0);
//#endregion
//#region node_modules/@clerk/astro/components/interactive/UserButton/UserButtonUserProfilePage.astro
createAstro("https://astro.build");
var $$UserButtonUserProfilePage = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$UserButtonUserProfilePage;
	const { url, label, parent } = Astro.props;
	let labelIcon = "";
	let content = "";
	if (Astro.slots.has("label-icon")) labelIcon = await Astro.slots.render("label-icon");
	if (Astro.slots.has("default")) content = await Astro.slots.render("default");
	return renderTemplate`<script>(function(){${defineScriptVars({
		url,
		label,
		content,
		labelIcon,
		parent
	})}
  // Get the user button map from window that we set in the \`<InternalUIComponentRenderer />\`.
  const userButtonComponentMap = window.__astro_clerk_component_props.get('user-button');

  let userButton;
  if (parent) {
    userButton = document.querySelector(\`[data-clerk-id="clerk-user-button-\${parent}"]\`);
  } else {
    userButton = document.querySelector('[data-clerk-id^="clerk-user-button"]');
  }

  const safeId = userButton.getAttribute('data-clerk-id');
  const currentOptions = userButtonComponentMap.get(safeId);

  const newCustomPage = {
    label,
    url,
    mountIcon: el => {
      el.innerHTML = labelIcon;
    },
    unmountIcon: () => {
      /* What to clean up? */
    },
    mount: el => {
      el.innerHTML = content;
    },
    unmount: () => {
      /* What to clean up? */
    },
  };

  userButtonComponentMap.set(safeId, {
    ...currentOptions,
    userProfileProps: {
      customPages: [...(currentOptions?.userProfileProps?.customPages ?? []), newCustomPage],
    },
  });
})();<\/script>`;
}, "/home/dereck/Documents/GIT/open-garage/node_modules/@clerk/astro/components/interactive/UserButton/UserButtonUserProfilePage.astro", void 0);
//#endregion
//#region node_modules/@clerk/astro/components/interactive/UserButton/index.ts
var UserButton = Object.assign($$UserButton, {
	MenuItems: $$UserButtonMenuItems,
	Link: $$UserButtonLink,
	Action: $$UserButtonAction,
	UserProfilePage: $$UserButtonUserProfilePage
});
//#endregion
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	const doors = [{
		id: "1",
		name: "Garage principal"
	}];
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Garage" }, { "default": async ($$result) => renderTemplate`${maybeRenderHead($$result)}<main class="min-h-screen bg-slate-950 p-6 text-white"><div class="mx-auto w-full max-w-md"><header class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Mis puertas</h1><p class="text-sm text-slate-400">${doors.length} dispositivo${doors.length === 1 ? "" : "s"}</p></div>${renderComponent($$result, "UserButton", UserButton, {})}</header><ul class="mt-6 space-y-3">${doors.map((d) => renderTemplate`<li class="door flex items-center gap-4 rounded-xl bg-slate-900 p-4 text-left ring-1 ring-white/10 transition hover:ring-cyan-400/40"${addAttribute(d.id, "data-id")}${addAttribute(d.name, "data-name")} role="button" tabindex="0"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-800 text-cyan-400"><svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V9l9-5 9 5v12" stroke-linecap="round" stroke-linejoin="round"></path><rect x="7" y="12" width="10" height="9" rx="1"></rect></svg></span><div class="min-w-0 flex-1"><p class="truncate font-semibold">${d.name}</p><p class="text-sm text-slate-400">Toque para activar</p></div><svg class="h-5 w-5 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"></path></svg></li>`)}</ul></div><!-- Modal: single toggle action (no open/closed state — the door is a momentary toggle) --><div id="modal" class="fixed inset-0 z-50 hidden items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"><section class="w-full max-w-sm rounded-2xl bg-slate-900 p-6 text-center ring-1 ring-white/10"><div class="flex items-center justify-between"><h2 id="m-name" class="text-lg font-bold"></h2><button id="m-close" class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"></path></svg></button></div><div class="mx-auto mt-8 grid h-28 w-28 place-items-center rounded-full bg-slate-800 text-cyan-400"><svg class="h-14 w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V9l9-5 9 5v12" stroke-linecap="round" stroke-linejoin="round"></path><rect x="7" y="12" width="10" height="9" rx="1"></rect></svg></div><p id="m-status" class="mt-6 h-5 text-sm font-medium text-slate-400"></p><button id="m-toggle" class="mt-4 w-full rounded-xl bg-cyan-400 py-4 text-lg font-bold text-slate-950 transition active:scale-[.98] disabled:opacity-50">Activar puerta</button></section></div></main><script>
    const modal = document.getElementById('modal');
    const mName = document.getElementById('m-name');
    const mStatus = document.getElementById('m-status');
    const mToggle = document.getElementById('m-toggle');
    let activeId = null;

    const openModal = (li) => {
      activeId = li.dataset.id;
      mName.textContent = li.dataset.name;
      mStatus.textContent = '';
      mStatus.className = 'mt-6 h-5 text-sm font-medium text-slate-400';
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    };
    const closeModal = () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      activeId = null;
    };

    document.querySelectorAll('.door').forEach((li) => {
      li.addEventListener('click', () => openModal(li));
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(li); } });
    });

    mToggle.addEventListener('click', async () => {
      if (!activeId) return;
      mToggle.disabled = true;
      mStatus.textContent = 'Enviando…';
      mStatus.className = 'mt-6 h-5 text-sm font-medium text-slate-400';
      try {
        const res = await fetch(\`/api/door/\${activeId}\`, { method: 'POST' });
        if (!res.ok) throw new Error(String(res.status));
        mStatus.textContent = 'Enviado ✓';
        mStatus.className = 'mt-6 h-5 text-sm font-medium text-emerald-400';
      } catch {
        mStatus.textContent = 'Error al enviar';
        mStatus.className = 'mt-6 h-5 text-sm font-medium text-rose-400';
      } finally {
        setTimeout(() => { mToggle.disabled = false; }, 1500);
      }
    });

    document.getElementById('m-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeId) closeModal(); });
  <\/script>` })}`;
}, "/home/dereck/Documents/GIT/open-garage/src/pages/index.astro", void 0);
var $$file = "/home/dereck/Documents/GIT/open-garage/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
