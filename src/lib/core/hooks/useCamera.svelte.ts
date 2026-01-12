import { getContext, setContext, untrack } from 'svelte'
import { OrthographicCamera, PerspectiveCamera } from 'three'
import { useSize } from './useSize.svelte.js'

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

const updateCamera = (
	camera: PerspectiveCamera | OrthographicCamera,
	width: number,
	height: number
) => {
	if ((camera as PerspectiveCamera).isPerspectiveCamera) {
		const perspective = camera as PerspectiveCamera
		perspective.aspect = width / height
	} else {
		const ortho = camera as OrthographicCamera
		ortho.left = width / -2
		ortho.right = width / 2
		ortho.top = height / 2
		ortho.bottom = height / -2
	}

	camera.updateProjectionMatrix()
}

const key = Symbol('camera-context')

interface CameraContext {
	current: PerspectiveCamera | OrthographicCamera
}

const defaultCameras = new Set()

export const provideCamera = () => {
	const size = useSize()

	const defaultCamera = new PerspectiveCamera(75, 0, 0.1, 1000)
	defaultCamera.position.z = 5
	defaultCamera.lookAt(0, 0, 0)

	let camera = $state.raw<PerspectiveCamera | OrthographicCamera>(defaultCamera)

	const context: CameraContext = {
		get current() {
			return camera
		},
		set current(value: PerspectiveCamera | OrthographicCamera) {
			camera = value ?? defaultCamera

			updateCamera(camera, size.current.width, size.current.height)
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
	const defaultCamera = camera.current

	const _object = $derived(object())
	const _manual = $derived(manual())

	$effect(() => {
		if (_manual) return

		for (const key in props()) {
			if (updateProjectionMatrixKeys.has(key)) {
				_object.updateProjectionMatrix()
				break
			}
		}
	})

	$effect.pre(() => {
		if (!_manual) {
			updateCamera(_object, size.current.width, size.current.height)
		}
	})

	$effect.pre(() => {
		const _makeDefault = makeDefault()

		if (_makeDefault) {
			defaultCameras.add(object)
			camera.current = _object
		}

		if (!_manual) {
			untrack(() => {
				updateCamera(_object, size.current.width, size.current.height)
			})
		}

		return () => {
			if (_makeDefault) {
				defaultCameras.delete(_object)
				if (defaultCameras.size === 0) {
					camera.current = defaultCamera
				}
			}
		}
	})
}
