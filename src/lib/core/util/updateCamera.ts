import { OrthographicCamera, PerspectiveCamera } from 'three'

export const updateCamera = (
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
