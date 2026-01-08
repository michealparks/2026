<script lang="ts">
	import { T, useThree } from '$lib/core'
	import { DirectionalLight, PlaneGeometry, RGBADepthPacking, Mesh, FogExp2 } from 'three'
	import { TerrainMaterial } from './material'
	import { TerrainDepthMaterial } from './depth'
	import { Pane } from 'tweakpane'

	const { scene } = useThree()

	const SIZE = 250
	const RESOLUTION = 1024
	const geometry = new PlaneGeometry(SIZE * 2, SIZE * 2, RESOLUTION, RESOLUTION)
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

		FOG_envMapIntensity: scene.backgroundIntensity,
		FOG_scatterDensity: 0.01,
		FOG_scatterHeightFalloff: 0.05,
		FOG_extinctionDensity: 0.015,
		FOG_extinctionHeightFalloff: 0.05,
	}

	const material = new TerrainMaterial({
		color: 0x808080,
		roughness: 1.0,
		metalness: 0.0,
	})

	const depthMaterial = new TerrainDepthMaterial({
		depthPacking: RGBADepthPacking,
	})

	for (const k in uniforms) {
		material.uniforms[k] = { value: uniforms[k] }
		depthMaterial.uniforms[k] = { value: uniforms[k] }
	}

	const pane = new Pane()

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

	const mesh = new Mesh(geometry, material)
	mesh.customDepthMaterial = depthMaterial
	mesh.castShadow = true
	mesh.receiveShadow = true

	const light = new DirectionalLight(0xffffff, 4)
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

	scene.fog = new FogExp2(0xffffff, 0.0025)
</script>

<T is={light} />
<T is={light.target} />

<T is={mesh} />
