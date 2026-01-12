import type { WebGLRenderer } from 'three'

interface Size {
	width: number
	height: number
}

export const resizeRendererToDisplaySize = (
	domSize: Size,
	canvasSize: Size,
	renderer: WebGLRenderer
) => {
	const width = Math.floor(domSize.width)
	const height = Math.floor(domSize.height)
	const needResize = canvasSize.width !== width || canvasSize.height !== height

	if (needResize) {
		renderer.setSize(width, height, true)

		return true
	}

	return false
}
