export const VERSION = 9

// canvas component
export { default as Canvas } from './components/Canvas/Canvas.svelte'

// components
export { T, extend } from './components/T/T.js'
export type { Props } from './components/T/types.js'

// plugins
export { type Plugin, injectPlugin } from './components/T/hooks/plugin.svelte.js'

// hooks
export { useThrelte } from './hooks/useThrelte.svelte.js'
export { useParent, useParentObject3D } from './components/T/hooks/useParent.svelte.js'
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
export { provideScene, useScene } from './hooks/useScene.js'
export { provideCamera, useCamera } from './hooks/useCamera.svelte.js'

// utils
export { observe } from './util/observe.svelte.js'
export { isInstanceOf } from './util/isInstanceOf.js'
export { asyncState } from './util/asyncState.js'
export { revision } from './util/revision.js'
