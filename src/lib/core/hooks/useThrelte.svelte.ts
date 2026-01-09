import { setContext, getContext } from 'svelte'
import { OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { Schedule } from 'directed'
import { updateCamera } from '../fn/updateCamera.js'
import { providerRenderer, type RendererContext } from './useRenderer.svelte.js'
import { provideCamera } from './useCamera.svelte.js'
import { provideScheduler } from './useSchedule.svelte.js'
import { provideScene } from './useScene.js'
import { type Size, type SizeContext, provideSize } from './useSize.svelte.js'
import { provideDOM } from './useDOM.svelte.js'

const key = Symbol('three-context')

interface Context extends RendererContext {
	dom: {
		current: HTMLElement
	}
	scene: Scene
	schedule: Schedule
	camera: {
		current: PerspectiveCamera | OrthographicCamera
	}
	size: SizeContext
	invalidate: () => void
}

interface Props {
	renderer: () => WebGLRenderer | undefined
	dom: () => HTMLElement
	size: () => Size
}

export const provideThrelte = (props: Props) => {
	const dom = provideDOM(props.dom)
	const size = provideSize(props.size)
	const scene = provideScene()
	const camera = provideCamera()
	const schedule = provideScheduler()
	const renderer = providerRenderer(props.renderer())

	const context: Context = {
		...renderer,
		dom,
		size,
		scene,
		schedule,
		camera: {
			get current() {
				return camera.current
			},
			set current(value: PerspectiveCamera | OrthographicCamera) {
				camera.set(value)
				updateCamera(
					camera.current,
					renderer.renderer.domElement.clientWidth,
					renderer.renderer.domElement.clientHeight
				)
			},
		},
	}

	setContext<Context>(key, context)

	return context
}

export const useThrelte = () => {
	return getContext<Context>(key)
}
