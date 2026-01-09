import {
	MeshStandardMaterial,
	type WebGLProgramParametersWithUniforms,
	type MeshStandardMaterialParameters,
} from 'three'
import vertexShader from './vertex.glsl?raw'

export class TerrainMaterial extends MeshStandardMaterial {
	uniforms: WebGLProgramParametersWithUniforms['uniforms'] = {}
	shader: WebGLProgramParametersWithUniforms | undefined

	constructor(parameters: MeshStandardMaterialParameters) {
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
				'#include <defaultnormal_vertex>',
				`
vec3 TERRAIN_position = position;
vec3 terrainNormal = objectNormal;

TERRAIN_transform(TERRAIN_position, terrainNormal);

objectNormal = terrainNormal;

#include <defaultnormal_vertex>
          `
			)

			shader.vertexShader = shader.vertexShader.replace(
				'#include <begin_vertex>',
				`#include <begin_vertex>

transformed = TERRAIN_position;

      `
			)
		}

		this.customProgramCacheKey = () => {
			let uniformStr = ''
			for (const k in this.uniforms) {
				uniformStr += `${k}:${this.uniforms[k].value};`
			}
			return 'custom-standard-material' + uniformStr
		}
	}
}
