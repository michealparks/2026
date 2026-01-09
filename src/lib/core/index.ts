export const VERSION = 9

// canvas component
export { default as Canvas } from './Canvas.svelte'

// components
export { T, extend } from './components/T.js'
export type { Props } from './fn/types.js'

// plugins
export { type Plugin, injectPlugin } from './hooks/plugin.svelte.js'

// hooks
export { useThrelte } from './hooks/useThrelte.svelte.js'
export { useParent } from './hooks/useParent.svelte.js'
export { useTask, type UseTaskOptions } from './hooks/useTask.svelte.js'

// useLoader
export {
	useLoader,
	type UseLoaderLoadOptions,
	type UseLoaderLoadInput,
	type UseLoaderLoadResult,
	type UseLoaderOptions,
} from './hooks/useLoader.svelte.js'

//contexts
export { provideThrelte } from './hooks/useThrelte.svelte.js'

// utils
export { observe } from './fn/observe.svelte.js'
export { isInstanceOf } from './fn/isInstanceOf.js'
export { asyncState } from './fn/asyncState.js'
export { revision } from './fn/revision.js'
