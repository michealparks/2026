import {
	MeshDepthMaterial,
	type WebGLProgramParametersWithUniforms,
	type MeshDepthMaterialParameters,
} from 'three'
import vertexShader from './vertex.glsl?raw'

export class TerrainDepthMaterial extends MeshDepthMaterial {
	uniforms: WebGLProgramParametersWithUniforms['uniforms'] = {}
	shader: WebGLProgramParametersWithUniforms | undefined

	constructor(parameters: MeshDepthMaterialParameters) {
		super(parameters)

		this.onBeforeCompile = (shader) => {
			this.shader = shader

			for (const k in this.uniforms) {
				shader.uniforms[k] = this.uniforms[k]
			}

			shader.vertexShader = shader.vertexShader.replace(
				'void main() {',
				vertexShader + 'void main() {'
			)

			shader.vertexShader = shader.vertexShader.replace(
				'#include <begin_vertex>',
				`#include <begin_vertex>

transformed = TERRAIN_calculatePosition(position);
`
			)
		}

		this.customProgramCacheKey = () => {
			let uniformStr = ''
			for (const k in this.uniforms) {
				uniformStr += `${k}:${this.uniforms[k].value};`
			}
			return 'custom-depth-material' + uniformStr
		}
	}
}
