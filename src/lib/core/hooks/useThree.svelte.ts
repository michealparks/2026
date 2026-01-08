import { setContext, getContext } from 'svelte'
import { OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { updateCamera } from '../fn/updateCamera'
import { providerRenderer, type RendererContext } from './useRenderer.svelte'
import { provideCamera } from './useCamera.svelte'
import { provideScheduler } from './useSchedule.svelte'
import { provideScene } from './useScene'
import type { Schedule } from 'directed'
import { type Size, type SizeContext, provideSize } from './useSize.svelte'

const key = Symbol('three-context')

interface Context extends RendererContext {
	scene: Scene
	schedule: Schedule
	camera: {
		current: PerspectiveCamera | OrthographicCamera
	}
	size: SizeContext
	invalidate: () => void
}

export const provideThree = (getSize: () => Size, userRenderer?: WebGLRenderer) => {
	const size = provideSize(getSize)
	const scene = provideScene()
	const camera = provideCamera()
	const schedule = provideScheduler()
	const renderer = providerRenderer(userRenderer)

	const context: Context = {
		...renderer,
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

export const useThree = () => {
	return getContext<Context>(key)
}
