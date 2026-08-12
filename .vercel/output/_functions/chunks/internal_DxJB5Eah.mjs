import { loadClerkJSScript, loadClerkUIScript, setClerkJSLoadingErrorPackageName } from "@clerk/shared/loadClerkJsScript";
import { isTruthy } from "@clerk/shared/underscore";
import { atom, batched, computed, map, onMount } from "nanostores";
import { deriveState } from "@clerk/shared/deriveState";
import { eventMethodCalled } from "@clerk/shared/telemetry";
import { customAlphabet, urlAlphabet } from "nanoid";
//#region node_modules/@clerk/astro/dist/external-DHTxQaok.js
var $csrState = map({
	isLoaded: false,
	client: void 0,
	user: void 0,
	session: void 0,
	organization: void 0
});
var $initialState = map();
var $clerk = atom(null);
computed([$csrState], (state) => state.isLoaded);
/**
* A client side store that is prepopulated with the authentication context during SSR.
* It is a nanostore, for instructions on how to use nanostores please review the [documentation](https://github.com/nanostores/nanostores)
*
* @example
* $authStore.subscribe((auth) => console.log(auth.userId))
*/
var $authStore = batched([$csrState, $initialState], (state, initialState) => {
	return deriveState(state.isLoaded, {
		session: state.session,
		user: state.user,
		organization: state.organization,
		client: state.client
	}, initialState);
});
computed([$authStore], (auth) => auth.user);
computed([$authStore], (auth) => auth.session);
/**
* A client side store that is populated after clerk-js has loaded.
* The store returns the Active Organization of the authenticated user or `null`.
* It is a nanostore, for instructions on how to use nanostores please review the [documentation](https://github.com/nanostores/nanostores)
*
* @example
* $organizationStore.subscribe((org) => console.log(org.id))
*/
var $organizationStore = computed([$authStore], (auth) => auth.organization);
/**
* A client side store that is populated after clerk-js has loaded.
* The store returns the clerk client or `null`.
* It is a nanostore, for instructions on how to use nanostores please review the [documentation](https://github.com/nanostores/nanostores)
*
* @example
* $clientStore.subscribe((client) => console.log(client?.signedInSessions?.length))
*/
var $clientStore = computed([$csrState], (csr) => csr.client);
/**
* A client side store that is populated after clerk-js is instanciated.
* The store returns the clerk instance or `null`.
* It is a nanostore, for instructions on how to use nanostores please review the [documentation](https://github.com/nanostores/nanostores)
*
* @example
* $clerkStore.subscribe((clerk) => console.log(clerk.publishableKey))
*/
var $clerkStore = computed([$clerk], (clerk) => clerk);
computed([$clientStore], (client) => client?.sessions);
/**
* A client side store that is populated after clerk-js has loaded.
* The store returns a `SignInResource` or `null`.
* It is a nanostore, for instructions on how to use nanostores please review the [documentation](https://github.com/nanostores/nanostores)
*
* @example
* $signInStore.subscribe((signIn) => console.log(signIn.status))
*/
var $signInStore = computed([$clientStore], (client) => client?.signIn);
/**
* A client side store that is populated after clerk-js has loaded.
* The store returns a `SignUpResource` or `null`.
* It is a nanostore, for instructions on how to use nanostores please review the [documentation](https://github.com/nanostores/nanostores)
*
* @example
* $signUpStore.subscribe((signUp) => console.log(signUp.status))
*/
var $signUpStore = computed([$clientStore], (client) => client?.signUp);
computed([$clerk], (clerk) => clerk?.billing);
/**
* Records a telemetry event when a store is used to match React hooks telemetry.
*
* @param {Store} store - The nanostore instance to monitor.
* @param {string} method - The name of the method associated with the store usage.
*/
var recordTelemetryEvent = (store, method) => {
	onMount(store, () => {
		$clerk.get()?.telemetry?.record(eventMethodCalled(method));
	});
};
recordTelemetryEvent($signInStore, "$signInStore");
recordTelemetryEvent($signUpStore, "$signUpStore");
recordTelemetryEvent($organizationStore, "$organizationStore");
//#endregion
//#region node_modules/@clerk/astro/dist/create-clerk-instance-Btlj_svM.js
/**
* Loop through any Astro component that has requested to invoke a function and invoke it with its respective props.
*/
var invokeClerkAstroJSFunctions = () => {
	["handleRedirectCallback"].forEach((fnName) => {
		document.querySelectorAll(`[data-clerk-function-id^="clerk-${fnName}"]`).forEach((el) => {
			const id = el.getAttribute("data-clerk-function-id");
			const props = window.__astro_clerk_function_props?.get(fnName)?.get(id) ?? {};
			$clerk.get()?.[fnName]?.(props);
		});
	});
};
/**
* Loop through any Astro component that has requested to mount a UI component and mount it with its respective props.
*/
var mountAllClerkAstroJSComponents = () => {
	Object.entries({
		"create-organization": "mountCreateOrganization",
		"organization-list": "mountOrganizationList",
		"organization-profile": "mountOrganizationProfile",
		"organization-switcher": "mountOrganizationSwitcher",
		"user-avatar": "mountUserAvatar",
		"user-button": "mountUserButton",
		"user-profile": "mountUserProfile",
		"sign-in": "mountSignIn",
		"sign-up": "mountSignUp",
		"google-one-tap": "openGoogleOneTap",
		waitlist: "mountWaitlist",
		"pricing-table": "mountPricingTable",
		"api-keys": "mountAPIKeys"
	}).forEach(([category, mountFn]) => {
		document.querySelectorAll(`[data-clerk-id^="clerk-${category}"]`).forEach((el) => {
			const clerkId = el.getAttribute("data-clerk-id");
			const props = window.__astro_clerk_component_props?.get(category)?.get(clerkId);
			if (el) $clerk.get()?.[mountFn](el, props);
		});
	});
};
/**
* Prevents mounting components multiple times when the `createClerkInstanceInternal` was been called twice without await first
* This is useful as the "integration" may call the function twice at the same time.
*/
var runOnce = (onFirst) => {
	let hasRun = false;
	return (params) => {
		if (hasRun) {
			const clerkJSInstance = window.Clerk;
			return new Promise((res) => {
				if (!clerkJSInstance) return res(false);
				if (clerkJSInstance.loaded) {
					mountAllClerkAstroJSComponents();
					invokeClerkAstroJSFunctions();
				}
				return res(clerkJSInstance.loaded);
			});
		}
		/**
		* Probably html streaming has delayed the component from mounting immediately.
		* In Astro, js modules will start executing only after html streaming has ended.
		*/
		hasRun = true;
		return onFirst(params);
	};
};
setClerkJSLoadingErrorPackageName("@clerk/astro");
function createNavigationHandler(windowNav) {
	return (to, opts) => {
		if (opts?.__internal_metadata?.navigationType === "internal") windowNav(history.state, "", to);
		else opts?.windowNavigate(to);
	};
}
/**
* Prevents firing clerk.load() multiple times
*/
var createClerkInstance = runOnce(createClerkInstanceInternal);
async function createClerkInstanceInternal(options) {
	const clerkJsChunk = getClerkJsEntryChunk(options);
	const ClerkUI = getClerkUIEntryChunk(options);
	await clerkJsChunk;
	if (!window.Clerk) throw new Error("Failed to download latest ClerkJS. Contact support@clerk.com.");
	const clerkJSInstance = window.Clerk;
	if (!$clerk.get()) $clerk.set(clerkJSInstance);
	const internalOptions = options;
	const keylessClaimUrl = internalOptions.__internal_keylessClaimUrl;
	const keylessApiKeysUrl = internalOptions.__internal_keylessApiKeysUrl;
	const clerkOptions = {
		routerPush: createNavigationHandler(window.history.pushState.bind(window.history)),
		routerReplace: createNavigationHandler(window.history.replaceState.bind(window.history)),
		...options,
		ui: {
			...options?.ui,
			ClerkUI
		},
		...keylessClaimUrl && { __internal_keyless_claimKeylessApplicationUrl: keylessClaimUrl },
		...keylessApiKeysUrl && { __internal_keyless_copyInstanceKeysUrl: keylessApiKeysUrl }
	};
	return clerkJSInstance.load(clerkOptions).then(() => {
		$csrState.setKey("isLoaded", true);
		$clerkStore.notify();
		mountAllClerkAstroJSComponents();
		invokeClerkAstroJSFunctions();
		clerkJSInstance.addListener((payload) => {
			$csrState.setKey("client", payload.client);
			$csrState.setKey("user", payload.user);
			$csrState.setKey("session", payload.session);
			$csrState.setKey("organization", payload.organization);
		});
	}).catch((err) => {
		console.error(err.stack || err.message || err);
	});
}
/**
* Loads clerk-js script if not already loaded.
* Returns early if window.Clerk already exists.
*/
async function getClerkJsEntryChunk(options) {
	await loadClerkJSScript(options);
}
/**
* Gets the ClerkUI constructor, either from options or by loading the script.
* Returns early if window.__internal_ClerkUICtor already exists.
* Returns undefined when prefetchUI={false} (no UI needed).
*/
function getClerkUIEntryChunk(options) {
	if (options?.ui?.ClerkUI) return options.ui.ClerkUI;
	if (options?.ui || options?.prefetchUI === false) return;
	return loadClerkUIEntryChunk(options);
}
async function loadClerkUIEntryChunk(options) {
	await loadClerkUIScript(options);
	if (!window.__internal_ClerkUICtor) throw new Error("Failed to download latest Clerk UI. Contact support@clerk.com.");
	return window.__internal_ClerkUICtor;
}
//#endregion
//#region node_modules/@clerk/astro/dist/internal/index.js
function mergePrefetchUIConfig(paramPrefetchUI) {
	if (paramPrefetchUI === false) return false;
}
var mergeEnvVarsWithParams = (params) => {
	const { signInUrl: paramSignIn, signUpUrl: paramSignUp, isSatellite: paramSatellite, proxyUrl: paramProxy, domain: paramDomain, publishableKey: paramPublishableKey, telemetry: paramTelemetry, __internal_clerkJSUrl: paramClerkJSUrl, __internal_clerkJSVersion: paramClerkJSVersion, __internal_clerkUIUrl: paramClerkUIUrl, __internal_clerkUIVersion: paramClerkUIVersion, prefetchUI: paramPrefetchUI, unsafe_disableDevelopmentModeConsoleWarning: paramUnsafeDisableDevelopmentModeConsoleWarning, ...rest } = params || {};
	const internalOptions = params;
	return {
		signInUrl: paramSignIn || void 0,
		signUpUrl: paramSignUp || void 0,
		isSatellite: paramSatellite || void 0,
		proxyUrl: paramProxy || void 0,
		domain: paramDomain || void 0,
		publishableKey: paramPublishableKey || internalOptions?.publishableKey || "pk_test_YnJpZ2h0LW9jdG9wdXMtNTYxMS5jbGVyay5hY2NvdW50cy5kZXYk",
		__internal_clerkJSUrl: paramClerkJSUrl || void 0,
		__internal_clerkJSVersion: paramClerkJSVersion || void 0,
		__internal_clerkUIUrl: paramClerkUIUrl || void 0,
		__internal_clerkUIVersion: paramClerkUIVersion || void 0,
		prefetchUI: mergePrefetchUIConfig(paramPrefetchUI),
		telemetry: paramTelemetry || {
			disabled: isTruthy(void 0),
			debug: isTruthy(void 0)
		},
		unsafe_disableDevelopmentModeConsoleWarning: paramUnsafeDisableDevelopmentModeConsoleWarning ?? isTruthy(void 0),
		__internal_keylessClaimUrl: internalOptions?.keylessClaimUrl,
		__internal_keylessApiKeysUrl: internalOptions?.keylessApiKeysUrl,
		...rest
	};
};
function createInjectionScriptRunner(creator) {
	async function runner(astroClerkOptions) {
		const ssrDataContainer = document.getElementById("__CLERK_ASTRO_DATA__");
		if (ssrDataContainer) $initialState.set(JSON.parse(ssrDataContainer.textContent || "{}"));
		const clientSafeVarsContainer = document.getElementById("__CLERK_ASTRO_SAFE_VARS__");
		let clientSafeVars = {};
		if (clientSafeVarsContainer) clientSafeVars = JSON.parse(clientSafeVarsContainer.textContent || "{}");
		await creator({ ...mergeEnvVarsWithParams({
			...astroClerkOptions,
			...clientSafeVars
		}) });
	}
	return runner;
}
var generateSafeId = (defaultSize = 10) => customAlphabet(urlAlphabet, defaultSize)();
var runInjectionScript = createInjectionScriptRunner(createClerkInstance);
//#endregion
export { runInjectionScript as n, generateSafeId as t };
