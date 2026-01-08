<script>
	import { T, useThree } from '$lib/core'
	import { OrbitControls } from '$lib/extras'

	const { scene } = useThree()
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

<T.Mesh>
	<T.BoxGeometry />
	<T.MeshStandardMaterial color="red" />
</T.Mesh>

<T.PerspectiveCamera
	makeDefault
	position={[5, 5, 5]}
	lookAt={[0, 0, 0]}
/>
