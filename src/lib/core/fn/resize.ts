import type { OrthographicCamera, PerspectiveCamera, WebGLRenderer } from 'three'
import { updateCamera } from './updateCamera'

interface Size {
	width: number
	height: number
}

export const resizeRendererToDisplaySize = (
	domSize: Size,
	canvasSize: Size,
	renderer: WebGLRenderer,
	cameras: Set<PerspectiveCamera | OrthographicCamera>
) => {
	const width = Math.floor(domSize.width)
	const height = Math.floor(domSize.height)
	const needResize = canvasSize.width !== width || canvasSize.height !== height

	if (needResize) {
		renderer.setSize(width, height, true)

		for (const camera of cameras) {
			updateCamera(camera, width, height)
		}

		return true
	}

	return false
}
