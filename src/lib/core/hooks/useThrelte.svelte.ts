import { setContext, getContext } from 'svelte'
import { OrthographicCamera, PerspectiveCamera, Scene, type WebGLRenderer } from 'three'
import type { WebGPURenderer } from 'three/webgpu'
import type { Schedule } from 'directed'
import { providerRenderer, useRenderer, type RendererContext } from './useRenderer.svelte.js'
import { provideCamera } from './useCamera.svelte.js'
import { provideScheduler } from './useSchedule.svelte.js'
import { provideScene } from './useScene.js'
import { type SizeContext, provideSize } from './useSize.svelte.js'
import { provideDOM, useDOM } from './useDOM.svelte.js'

const key = Symbol('three-context')

interface UseThrelteContext extends RendererContext {
	scene: Scene
	camera: {
		current: PerspectiveCamera | OrthographicCamera
	}
	dom: HTMLElement
	schedule: Schedule
	size: SizeContext
	invalidate: () => void
}

export const provideThrelte = <Type extends WebGLRenderer | WebGPURenderer = WebGLRenderer>(
	dom: HTMLElement,
	renderer: Type,
	size: () => { width: number; height: number }
) => {
	// Reused in child contexts
	const rendererContext = useRenderer() ?? providerRenderer(renderer)
	const domContext = useDOM() ?? provideDOM(dom)
	const scheduleContext = provideScheduler()

	// Never reused
	const sizeContext = provideSize(size)
	const sceneContext = provideScene()
	const cameraContext = provideCamera()

	const context: UseThrelteContext = {
		...rendererContext,
		dom: domContext,
		size: sizeContext,
		scene: sceneContext,
		schedule: scheduleContext,
		camera: cameraContext,
	}

	setContext<UseThrelteContext>(key, context)

	return context
}

export const useThrelte = () => {
	return getContext<UseThrelteContext>(key)
}
