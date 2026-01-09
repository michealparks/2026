<script>
	import { T, useThrelte } from '$lib/core'
	import { interactivity, OrbitControls } from '$lib/extras'
	import { Spring } from 'svelte/motion'

	const spring = new Spring(1)

	const { scene } = useThrelte()

	interactivity()
</script>

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

<T.Mesh
	scale={spring.current}
	onclick={() => {
		spring.set(2)
	}}
	onpointerenter={() => {
		spring.set(1.5)
	}}
	onpointerleave={() => {
		spring.set(1)
	}}
>
	<T.BoxGeometry />
	<T.MeshStandardMaterial color="red" />
</T.Mesh>

<T.PerspectiveCamera
	makeDefault
	position={[5, 5, 5]}
	lookAt={[0, 0, 0]}
/>
