/* eslint-disable svelte/prefer-svelte-reactivity */
import { getContext, setContext } from 'svelte'
import { OrthographicCamera, PerspectiveCamera } from 'three'
import type { MaybeInstance } from '../fn/types'
import { useSize } from './useSize.svelte'
import { updateCamera } from '../fn/updateCamera'

const key = Symbol('camera-context')

interface CameraContext {
	current: PerspectiveCamera | OrthographicCamera
	managedCameras: Set<PerspectiveCamera | OrthographicCamera>
	set(value?: PerspectiveCamera | OrthographicCamera | undefined): void
}

const defaultCameras = new Set()
const defaultCamera = new PerspectiveCamera(75, 0, 0.1, 1000)
defaultCamera.position.z = 5
defaultCamera.lookAt(0, 0, 0)

export const provideCamera = () => {
	const managedCameras = new Set<PerspectiveCamera | OrthographicCamera>()
	managedCameras.add(defaultCamera)

	let camera = $state.raw<PerspectiveCamera | OrthographicCamera>(defaultCamera)

	const context: CameraContext = {
		managedCameras,
		get current() {
			return camera
		},
		set(value?: PerspectiveCamera | OrthographicCamera | undefined) {
			camera = value ?? defaultCamera
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
			camera.set(cam)
		}

		if (!_manual) {
			updateCamera(cam, size.current.width, size.current.height)
			camera.managedCameras.add(cam)
		}

		return () => {
			if (_makeDefault) {
				defaultCameras.delete(cam)
				if (defaultCameras.size === 0) {
					camera.set(defaultCamera)
				}
			}

			if (!_manual) {
				camera.managedCameras.delete(cam)
			}
		}
	})
}
