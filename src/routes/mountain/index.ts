import * as THREE from 'three'

import { App } from '$lib/app'
import type { MeshStandardMaterialParameters } from 'three'

const TERRAIN_VSH = `
uniform float TERRAIN_flatness;
uniform float TERRAIN_size;
uniform float TERRAIN_resolution;
uniform float TERRAIN_scale;
uniform int TERRAIN_octaves;
uniform float TERRAIN_persistence;
uniform float TERRAIN_lacunarity;
uniform float TERRAIN_height;
uniform float TERRAIN_seed;
uniform float TERRAIN_dropoff;

#include <noise>

vec3 TERRAIN_calculatePosition(vec3 position) {

  vec3 result = position;
  result.y = TERRAIN_height * FBM_1_3_TERRAIN(
      vec3(position.xz * TERRAIN_scale, TERRAIN_seed),
      TERRAIN_octaves,
      TERRAIN_persistence,
      TERRAIN_lacunarity,
      TERRAIN_flatness,
      TERRAIN_dropoff);

  // Flatten the edges
  float edgeValue = (
      smoothstep(TERRAIN_size - 18.0, TERRAIN_size - 20.0, abs(position.x)) *
      smoothstep(TERRAIN_size - 18.0, TERRAIN_size - 20.0, abs(position.z)));

  result.y *= edgeValue;

  float dropoff = (
      smoothstep(TERRAIN_size - 0.0, TERRAIN_size - 5.0, abs(position.x)) *
      smoothstep(TERRAIN_size - 0.0, TERRAIN_size - 5.0, abs(position.z)));

  result.y -= (1.0 - dropoff) * 25.0;

  return result;

}

void TERRAIN_transform(inout vec3 pos, inout vec3 normal) {

  vec2 eps = vec2(TERRAIN_size / TERRAIN_resolution, 0.0);
  vec3 dx = TERRAIN_calculatePosition(pos + eps.xyy) - TERRAIN_calculatePosition(pos - eps.xyy);
  vec3 dz = TERRAIN_calculatePosition(pos + eps.yyx) - TERRAIN_calculatePosition(pos - eps.yyx);

  dx = normalize(dx);
  dz = normalize(dz);

  normal = normalize(cross(dz, dx));
  pos = TERRAIN_calculatePosition(pos);
}

`

THREE.ShaderChunk.fog_vertex = `
#ifdef USE_FOG
  vWorldPosition = worldPosition.xyz;
#endif
`

THREE.ShaderChunk.fog_pars_vertex = `
#ifdef USE_FOG
  varying vec3 vWorldPosition;
  varying float vFogDepth;
#endif
`

THREE.ShaderChunk.fog_pars_fragment = `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    uniform float fogDensity;

    uniform float FOG_scatterDensity;
    uniform float FOG_scatterHeightFalloff;
    uniform float FOG_extinctionDensity;
    uniform float FOG_extinctionHeightFalloff;
    uniform float FOG_envMapIntensity;

    varying float vFogDepth;
    varying vec3 vWorldPosition;
  #endif
#endif

float calculateFogFactor(
    vec3 fogOrigin,
    vec3 fogDirection,
    float fogDepth,
    float density,
    float heightFalloff) {
  float scatterFactor = fogDepth * exp(-fogOrigin.y * heightFalloff);
  if (abs(fogDirection.y) > 0.0001) {
    float t = heightFalloff * fogDirection.y;
    scatterFactor = scatterFactor * (1.0 - exp(-t)) / t;
  }
  scatterFactor = 1.0 - exp(-scatterFactor * density);
  scatterFactor = saturate(scatterFactor * scatterFactor);
  return scatterFactor;
}

`

THREE.ShaderChunk.fog_fragment = `

#ifdef USE_FOG

  vec3 fogOrigin = cameraPosition;
  vec3 fogDirection = vWorldPosition - cameraPosition;
  float fogDepth = length(fogDirection);

  float scatterFactor = calculateFogFactor(
      fogOrigin,
      fogDirection,
      fogDepth,
      FOG_scatterDensity,
      FOG_scatterHeightFalloff);

  float extinctionFactor = calculateFogFactor(
      fogOrigin,
      fogDirection,
      fogDepth,
      FOG_extinctionDensity,
      FOG_extinctionHeightFalloff);

  vec3 fogSampleDir = inverseTransformDirection(
      -geometryViewDir, viewMatrix);

  vec3 fogScatterColour = textureCubeUV(
      envMap, envMapRotation * fogSampleDir, 0.5).xyz * FOG_envMapIntensity;

  vec3 fogColor = vec3(1.0, 1.0, 1.0);
  fogColor = fogScatterColour;

  gl_FragColor.rgb = (
      gl_FragColor.rgb * (1.0 - extinctionFactor) +
      fogColor * scatterFactor);

#endif
`

class MeshStandardMaterial_Override extends THREE.MeshStandardMaterial {
	uniforms = {}
	shader: THREE.WebGLProgramParametersWithUniforms | undefined

	constructor(parameters: MeshStandardMaterialParameters) {
		super(parameters)

		const previousCallback = this.onBeforeCompile
		this.onBeforeCompile = (shader) => {
			this.shader = shader

			for (let k in this.uniforms) {
				shader.uniforms[k] = this.uniforms[k]
			}

			shader.vertexShader = shader.vertexShader.replace(
				'void main() {',
				TERRAIN_VSH + 'void main() {'
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
			for (let k in this.uniforms) {
				uniformStr += `${k}:${this.uniforms[k].value};`
			}
			return 'custom-standard-material' + uniformStr
		}
	}
}

class MeshDepthMaterial_Override extends THREE.MeshDepthMaterial {
	uniforms: THREE.WebGLProgramParametersWithUniforms['uniforms'] = {}
	shader: THREE.WebGLProgramParametersWithUniforms | undefined

	constructor(parameters: THREE.MeshDepthMaterialParameters) {
		super(parameters)

		const previousCallback = this.onBeforeCompile
		this.onBeforeCompile = (shader) => {
			this.shader = shader

			for (let k in this.uniforms) {
				shader.uniforms[k] = this.uniforms[k]
			}

			shader.vertexShader = shader.vertexShader.replace(
				'void main() {',
				TERRAIN_VSH + 'void main() {'
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
			for (let k in this.uniforms) {
				uniformStr += `${k}:${this.uniforms[k].value};`
			}
			return 'custom-depth-material' + uniformStr
		}
	}
}

class CustomizeMaterialsProject extends App {
	constructor() {
		super()
	}

	async onSetupProject(pane) {
		await this.loadRGBE('./resources/skybox/rosendal_park_sunset_1k.hdr')

		THREE.ShaderChunk.noise = await this.#loadText_('./resources/shaders/noise.glsl')

		await this.#loadTerrain_(pane)
	}

	async #loadText_(url) {
		const response = await fetch(url)
		const text = await response.text()
		return text
	}

	async #loadTerrain_(pane) {
		const SIZE = 250
		const RESOLUTION = 1024
		const geometry = new THREE.PlaneGeometry(SIZE * 2, SIZE * 2, RESOLUTION, RESOLUTION)
		geometry.rotateX(-Math.PI / 2)

		const uniforms = {
			TERRAIN_resolution: RESOLUTION,
			TERRAIN_size: SIZE,
			TERRAIN_scale: 0.01,
			TERRAIN_octaves: 8,
			TERRAIN_persistence: 0.5,
			TERRAIN_lacunarity: 2.0,
			TERRAIN_height: 200.0,
			TERRAIN_flatness: 3.5,
			TERRAIN_seed: 0.0,
			TERRAIN_dropoff: 0.0,

			FOG_envMapIntensity: this.Scene.backgroundIntensity,
			FOG_scatterDensity: 0.01,
			FOG_scatterHeightFalloff: 0.05,
			FOG_extinctionDensity: 0.015,
			FOG_extinctionHeightFalloff: 0.05,
		}

		const material = new MeshStandardMaterial_Override({
			color: 0x808080,
			roughness: 1.0,
			metalness: 0.0,
		})

		const depthMaterial = new MeshDepthMaterial_Override({
			depthPacking: THREE.RGBADepthPacking,
		})

		for (let k in uniforms) {
			material.uniforms[k] = { value: uniforms[k] }
			depthMaterial.uniforms[k] = { value: uniforms[k] }
		}

		// Tweak terrain
		const terrainFolder = pane.addFolder({ title: 'Terrain' })

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Scale',
				min: 0.001,
				max: 0.025,
				value: uniforms.TERRAIN_scale,
				step: 0.001,
			})
			.on('change', (ev) => {
				material.uniforms.TERRAIN_scale.value = ev.value
				depthMaterial.uniforms.TERRAIN_scale.value = ev.value
			})

		const dummy = {
			octaves: uniforms.TERRAIN_octaves,
		}
		terrainFolder
			.addBinding(dummy, 'octaves', {
				min: 1,
				max: 9,
				step: 1,
			})
			.on('change', (ev) => {
				material.uniforms.TERRAIN_octaves.value = ev.value
				depthMaterial.uniforms.TERRAIN_octaves.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Persistence',
				min: 0.0,
				max: 1.0,
				value: uniforms.TERRAIN_persistence,
				step: 0.01,
			})
			.on('change', (ev) => {
				material.uniforms.TERRAIN_persistence.value = ev.value
				depthMaterial.uniforms.TERRAIN_persistence.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Lacunarity',
				min: 1.0,
				max: 3.0,
				value: uniforms.TERRAIN_lacunarity,
				step: 0.01,
			})
			.on('change', (ev) => {
				material.uniforms.TERRAIN_lacunarity.value = ev.value
				depthMaterial.uniforms.TERRAIN_lacunarity.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Height',
				min: 0.0,
				max: 300.0,
				value: uniforms.TERRAIN_height,
				step: 1.0,
			})
			.on('change', (ev) => {
				material.uniforms.TERRAIN_height.value = ev.value
				depthMaterial.uniforms.TERRAIN_height.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Flatness',
				min: 1.0,
				max: 4.0,
				value: uniforms.TERRAIN_flatness,
				step: 0.01,
			})
			.on('change', (ev) => {
				material.uniforms.TERRAIN_flatness.value = ev.value
				depthMaterial.uniforms.TERRAIN_flatness.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Seed',
				min: 0.0,
				max: 2.0,
				value: uniforms.TERRAIN_seed,
				step: 0.01,
			})
			.on('change', (ev) => {
				material.uniforms.TERRAIN_seed.value = ev.value
				depthMaterial.uniforms.TERRAIN_seed.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Dropoff',
				min: 0.0,
				max: 1.0,
				value: uniforms.TERRAIN_dropoff,
				step: 0.01,
			})
			.on('change', (ev) => {
				material.uniforms.TERRAIN_dropoff.value = ev.value
				depthMaterial.uniforms.TERRAIN_dropoff.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Scatter Density',
				min: 0.0,
				max: 0.1,
				value: uniforms.FOG_scatterDensity,
			})
			.on('change', (ev) => {
				material.uniforms.FOG_scatterDensity.value = ev.value
				depthMaterial.uniforms.FOG_scatterDensity.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Scatter Height Falloff',
				min: 0.0,
				max: 0.1,
				value: uniforms.FOG_scatterHeightFalloff,
			})
			.on('change', (ev) => {
				material.uniforms.FOG_scatterHeightFalloff.value = ev.value
				depthMaterial.uniforms.FOG_scatterHeightFalloff.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Extinction Density',
				min: 0.0,
				max: 0.1,
				value: uniforms.FOG_extinctionDensity,
			})
			.on('change', (ev) => {
				material.uniforms.FOG_extinctionDensity.value = ev.value
				depthMaterial.uniforms.FOG_extinctionDensity.value = ev.value
			})

		terrainFolder
			.addBlade({
				view: 'slider',
				label: 'Extinction Height Falloff',
				min: 0.0,
				max: 0.1,
				value: uniforms.FOG_extinctionHeightFalloff,
			})
			.on('change', (ev) => {
				material.uniforms.FOG_extinctionHeightFalloff.value = ev.value
				depthMaterial.uniforms.FOG_extinctionHeightFalloff.value = ev.value
			})

		const mesh = new THREE.Mesh(geometry, material)
		mesh.customDepthMaterial = depthMaterial
		mesh.castShadow = true
		mesh.receiveShadow = true
		this.Scene.add(mesh)

		const light = new THREE.DirectionalLight(0xffffff, 4)
		light.position.set(100, 100, 100)
		light.target.position.set(0, 0, 0)
		light.castShadow = true
		light.shadow.mapSize.width = 1024
		light.shadow.mapSize.height = 1024
		light.shadow.camera.near = 0.5
		light.shadow.camera.far = 500
		light.shadow.camera.left = -256
		light.shadow.camera.right = 256
		light.shadow.camera.top = 256
		light.shadow.camera.bottom = -256
		light.shadow.bias = -0.0001

		this.Scene.fog = new THREE.FogExp2(0xffffff, 0.0025)
		this.Scene.add(light)
		this.Scene.add(light.target)
	}

	onStep(timeElapsed, totalTime) {
		let a = 0
	}
}

let APP_ = new CustomizeMaterialsProject()

window.addEventListener('DOMContentLoaded', async () => {
	await APP_.initialize()
})
