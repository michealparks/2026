<script lang="ts">
	import { T, useThrelte, useTask } from '$lib/core'
	import { interactivity, OrbitControls } from '$lib/extras'
	import { Spring } from 'svelte/motion'
	import { Mesh } from 'three'

	const { scene, invalidate } = useThrelte()

	interactivity()
</script>

<T.PerspectiveCamera
	makeDefault
	position={[10, 10, 10]}
	lookAt={[0, -5, 0]}
/>

<T.DirectionalLight position={[-5, 5, 5]}>
	{#snippet children({ ref })}
		<T
			is={ref.target}
			attach={scene}
		/>
	{/snippet}
</T.DirectionalLight>

<T.AmbientLight />

<OrbitControls />

{#each { length: 20 }, x}
	{#each { length: 20 }, z}
		{@const mesh = new Mesh()}
		{@const scale = new Spring(1)}
		{@const color = new Spring<[number, number, number]>([0.5, 0.5, 0])}
		{@const task = useTask((dt) => {
			mesh.rotation.x += dt / 2000
			mesh.rotation.y += dt / 2000
			invalidate()
		})}
		<T
			is={mesh}
			position.x={(x - 10) * 1.5}
			position.z={(z - 10) * 1.5}
			rotation.x={x / 10 + z / 10}
			rotation.y={x / 10 + z / 10}
			scale={scale.current}
			onpointerenter={() => {
				color.set([1, 0, 0])
				scale.set(1.5)
			}}
			onpointerleave={() => {
				color.set([0, 1, 0])
				scale.set(1)
			}}
		>
			<T.BoxGeometry />
			<T.MeshStandardMaterial color={color.current} />
		</T>
	{/each}
{/each}
