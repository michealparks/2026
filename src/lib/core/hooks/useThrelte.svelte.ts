import { setContext, getContext } from 'svelte'
import {
	OrthographicCamera,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	type ToneMapping,
	type ShadowMapType,
} from 'three'
import type { Schedule } from 'directed'
import { providerRenderer, useRenderer, type RendererContext } from './useRenderer.svelte.js'
import { provideCamera } from './useCamera.svelte.js'
import { provideScheduler } from './useSchedule.svelte.js'
import { provideScene } from './useScene.js'
import { type Size, type SizeContext, provideSize } from './useSize.svelte.js'
import { provideDOM } from './useDOM.svelte.js'

const key = Symbol('three-context')

interface UseThrelteContext extends RendererContext {
	scene: Scene
	camera: {
		current: PerspectiveCamera | OrthographicCamera
	}
	dom: {
		current: HTMLElement
	}
	schedule: Schedule
	size: SizeContext
	invalidate: () => void
}

interface Props {
	renderer: () => WebGLRenderer
	dom: () => HTMLElement
	size: () => Size
	autoRender: () => boolean
	renderMode: () => 'always' | 'on-demand' | 'manual'
	dpr: () => number
	toneMapping: () => ToneMapping
	shadows: () => boolean | ShadowMapType
}

export const provideThrelte = (props: Props) => {
	const dom = provideDOM(props.dom)
	const size = provideSize(props.size)
	const scene = provideScene()
	const camera = provideCamera()
	const schedule = provideScheduler()
	const renderer = useRenderer() ?? providerRenderer(props)

	const context: UseThrelteContext = {
		...renderer,
		dom,
		size,
		scene,
		schedule,
		camera,
	}

	setContext<UseThrelteContext>(key, context)

	return context
}

export const useThrelte = () => {
	return getContext<UseThrelteContext>(key)
}
