import type { ShadowMapType, ToneMapping, WebGLRenderer } from 'three'
import type { WebGPURenderer } from 'three/webgpu'

export interface CanvasProps<Type extends WebGLRenderer | WebGPURenderer = WebGLRenderer> {
	dpr?: number
	toneMapping?: ToneMapping
	shadows?: false | ShadowMapType
	autoRender?: boolean
	renderMode?: 'always' | 'on-demand' | 'manual'

	cache?: boolean
	renderer?: Type
}
