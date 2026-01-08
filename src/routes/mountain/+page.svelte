<script lang="ts">
	import { T, useThree } from '$lib/core'
	import { OrbitControls } from '$lib/extras'
	import { useHDR } from '$lib/extras/useHDR.svelte'
	import Cube from './Cube.svelte'
	import { shaderChunk } from './shaderChunk'
	import Terrain from './Terrain/Terrain.svelte'

	const { scene, camera } = useThree()

	shaderChunk()

	let length = $state(1)
	let debug = false

	const hdr = useHDR('hdr/rosendal_park_sunset_1k.hdr')
</script>

<svelte:window
	onclick={(event) => {
		length += event.metaKey ? -1 : 1
	}}
/>

{#if hdr.current}
	<OrbitControls enableDamping />

	<T.AmbientLight />

	<T.DirectionalLight
		castShadow
		position={[-5, 5, 0]}
		intensity={1}
	>
		{#snippet children({ ref })}
			{#if debug}
				<T.DirectionalLightHelper
					args={[ref]}
					attach={scene}
					oncreate={(ref) => {
						requestAnimationFrame(function frame() {
							requestAnimationFrame(frame)
							ref.update()
						})
					}}
				/>

				<T.CameraHelper
					args={[ref.shadow.camera]}
					attach={scene}
					oncreate={(ref) => {
						requestAnimationFrame(function frame() {
							requestAnimationFrame(frame)
							ref.update()
						})
					}}
				/>
			{/if}
		{/snippet}
	</T.DirectionalLight>

	<T.PerspectiveCamera
		makeDefault
		position={[300, 300, 300]}
		lookAt={[0, 0, 0]}
	/>

	{#each { length }}
		<Cube />
	{/each}

	<Terrain />
{/if}
