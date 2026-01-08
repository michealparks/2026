import { getContext, setContext } from 'svelte'
import { WebGLRenderer } from 'three'
import { useTask } from './useTask.svelte'
import { useCamera } from './useCamera.svelte'
import { useScene } from './useScene'

const browser = typeof window !== 'undefined'

const key = Symbol('renderer-context')

type RenderMode = 'always' | 'on-demand' | 'manual'

export interface RendererContext {
	renderer: WebGLRenderer

	/**
	 * A flag to indicate whether the current frame has been invalidated
	 */
	invalidated: boolean

	/**
	 * If anything is in this set, the frame will be considered invalidated
	 */
	autoInvalidations: Set<unknown>

	/**
	 * By default, Threlte will automatically render the scene. To implement
	 * custom render pipelines, set this to `false`.
	 *
	 * @default true
	 */
	autoRender: {
		current: boolean
	}

	/**
	 * Invalidates the current frame when renderMode is 'on-demand' or 'manual'
	 */
	invalidate: () => void

	/**
	 * Function to determine if a rendering should happen according to on-demand
	 * rendering. The value of this function is valid for the duration of the
	 * current frame.
	 */
	shouldRender: () => boolean

	/**
	 * @default 'on-demand'
	 */
	renderMode: {
		current: RenderMode
	}
}

export const providerRenderer = (userRenderer?: WebGLRenderer) => {
	const scene = useScene()
	const camera = useCamera()

	let autoRender = $state(true)
	let renderMode = $state<RenderMode>('on-demand')
	let invalidated = true
	const autoInvalidations = new Set()

	const renderer = browser
		? (userRenderer ??
			new WebGLRenderer({
				powerPreference: 'high-performance',
				antialias: true,
				alpha: true,
			}))
		: undefined!

	const shouldRender = () => {
		if (renderMode === 'always') {
			return true
		}

		if (renderMode === 'on-demand' && (invalidated || autoInvalidations.size > 0)) {
			return true
		}

		if (renderMode === 'manual' && invalidated) {
			return true
		}

		return false
	}

	const context: RendererContext = {
		renderer,
		get invalidated() {
			return invalidated
		},
		set invalidated(value: boolean) {
			invalidated = value
		},
		invalidate: () => {
			invalidated = true
		},
		shouldRender,
		autoInvalidations,
		autoRender: {
			get current() {
				return autoRender
			},
			set current(value: boolean) {
				autoRender = value
			},
		},
		renderMode: {
			get current() {
				return renderMode
			},
			set current(value: RenderMode) {
				renderMode = value
			},
		},
	}

	useTask(
		() => {
			if (shouldRender()) {
				renderer.render(scene, camera.current)
			}

			invalidated = false
		},
		{
			tag: 'render',
			running: () => autoRender,
		}
	)

	setContext(key, context)

	return context
}

export const useRenderer = () => {
	return getContext<RendererContext>(key)
}
