import { getContext, setContext } from 'svelte'
import { OrthographicCamera, PerspectiveCamera } from 'three'
import { useSize } from './useSize.svelte.js'
import { useDOM } from './useDOM.svelte.js'
import { updateCamera } from '../util/updateCamera.js'

const updateProjectionMatrixKeys = new Set([
	'fov',
	'aspect',
	'near',
	'far',
	'left',
	'right',
	'top',
	'bottom',
	'zoom',
])

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

export const useManageCamera = (
	object: () => PerspectiveCamera | OrthographicCamera,
	makeDefault: () => boolean | undefined,
	manual: () => boolean | undefined,
	props: () => Record<string, unknown>
) => {
	const size = useSize()
	const camera = useCamera()

	const _object = $derived(object())
	const _manual = $derived(manual())

	$effect(() => {
		for (const key in props()) {
			if (updateProjectionMatrixKeys.has(key)) {
				_object.updateProjectionMatrix()
				break
			}
		}
	})

	$effect.pre(() => {
		const _makeDefault = makeDefault()

		if (_makeDefault) {
			defaultCameras.add(object)
			camera.current = _object
		}

		if (!_manual) {
			updateCamera(_object, size.current.width, size.current.height)
			managedCameras.add(_object)
		}

		return () => {
			if (_makeDefault) {
				defaultCameras.delete(_object)
				if (defaultCameras.size === 0) {
					camera.current = defaultCamera
				}
			}

			if (!_manual) {
				managedCameras.delete(_object)
			}
		}
	})
}
