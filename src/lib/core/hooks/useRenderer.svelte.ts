import { getContext, setContext } from 'svelte'
import {
	type ShadowMapType,
	type ToneMapping,
	AgXToneMapping,
	PCFSoftShadowMap,
	WebGLRenderer,
} from 'three'

const key = Symbol('renderer-context')

type RenderMode = 'always' | 'on-demand' | 'manual'

export interface RendererContext {
	renderer: WebGLRenderer

	toneMapping: { current: ToneMapping }
	shadows: { current: false | ShadowMapType }
	dpr: { current: number }

	/**
	 * A flag to indicate whether the current frame has been invalidated
	 */
	invalidated: {
		current: boolean
	}

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

export const providerRenderer = (props: {
	renderer: () => WebGLRenderer
	autoRender?: () => boolean
	renderMode?: () => RenderMode
	toneMapping?: () => ToneMapping
	shadows?: () => ShadowMapType | false
	dpr?: () => number
}) => {
	const renderer = $derived(props.renderer())

	let autoRender = $derived(props.autoRender?.() ?? true)
	let renderMode = $derived<RenderMode>(props.renderMode?.() ?? 'on-demand')
	let toneMapping = $derived<ToneMapping>(props.toneMapping?.() ?? AgXToneMapping)
	let shadows = $derived<ShadowMapType | false>(props.shadows?.() ?? PCFSoftShadowMap)
	let dpr = $derived<number>(props.dpr?.() ?? window.devicePixelRatio)

	let invalidated = true
	const autoInvalidations = new Set()

	$effect.pre(() => {
		renderer.toneMapping = toneMapping
	})

	$effect.pre(() => {
		renderer.shadowMap.enabled = shadows !== false

		if (shadows !== false) {
			renderer.shadowMap.type = shadows
		}
	})

	$effect.pre(() => {
		renderer.setPixelRatio(dpr)
	})

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

		toneMapping: {
			get current() {
				return toneMapping
			},
			set current(value: ToneMapping) {
				toneMapping = value
			},
		},
		shadows: {
			get current() {
				return shadows
			},
			set current(value: ShadowMapType | false) {
				shadows = value
			},
		},
		dpr: {
			get current() {
				return dpr
			},
			set current(value: number) {
				dpr = value
			},
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
		invalidated: {
			get current() {
				return invalidated
			},
			set current(value: boolean) {
				invalidated = value
			},
		},
		invalidate: () => {
			invalidated = true
		},
	}

	setContext(key, context)

	return context
}

export const useRenderer = () => {
	return getContext<RendererContext>(key)
}
