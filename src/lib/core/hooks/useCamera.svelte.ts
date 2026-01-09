import { getContext, setContext } from 'svelte'
import { OrthographicCamera, PerspectiveCamera } from 'three'
import type { MaybeInstance } from '../util/types.js'
import { useSize } from './useSize.svelte.js'
import { useDOM } from './useDOM.svelte.js'
import { updateCamera } from '../util/updateCamera.js'

const key = Symbol('camera-context')

interface CameraContext {
	current: PerspectiveCamera | OrthographicCamera
}

const defaultCameras = new Set()
const defaultCamera = new PerspectiveCamera(75, 0, 0.1, 1000)
defaultCamera.position.z = 5
defaultCamera.lookAt(0, 0, 0)

export const managedCameras = new Set<PerspectiveCamera | OrthographicCamera>()
managedCameras.add(defaultCamera)

export const provideCamera = () => {
	const dom = useDOM()

	let camera = $state.raw<PerspectiveCamera | OrthographicCamera>(defaultCamera)

	const context: CameraContext = {
		get current() {
			return camera
		},
		set current(value: PerspectiveCamera | OrthographicCamera) {
			camera = value ?? defaultCamera

			updateCamera(camera, dom.current.clientWidth, dom.current.clientHeight)
		},
	}

	setContext(key, context)

	return context
}

export const useCamera = () => {
	return getContext<CameraContext>(key)
}

export const useManageCamera = <Type>(
	object: () => MaybeInstance<Type>,
	makeDefault: () => boolean | undefined,
	manual: () => boolean | undefined
) => {
	const size = useSize()
	const camera = useCamera()

	$effect.pre(() => {
		const _object = object()

		if (
			(_object as PerspectiveCamera).isPerspectiveCamera !== true &&
			(_object as OrthographicCamera).isOrthographicCamera !== true
		) {
			return
		}

		const cam = _object as PerspectiveCamera | OrthographicCamera
		const _makeDefault = makeDefault()
		const _manual = manual()

		if (_makeDefault) {
			defaultCameras.add(object)
			camera.current = cam
		}

		if (!_manual) {
			updateCamera(cam, size.current.width, size.current.height)
			managedCameras.add(cam)
		}

		return () => {
			if (_makeDefault) {
				defaultCameras.delete(cam)
				if (defaultCameras.size === 0) {
					camera.current = defaultCamera
				}
			}

			if (!_manual) {
				managedCameras.delete(cam)
			}
		}
	})
}
