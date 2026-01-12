<script>
	import { T, useThrelte } from '$lib/core'
	import { interactivity, OrbitControls, HUD, RenderTexture, Edges } from '$lib/extras'
	import { Spring } from 'svelte/motion'
	import HUDScene from './hud.svelte'
	import RenderTextureScene from './texture.svelte'
	import { Color } from 'three'

	const color = new Spring([1, 0, 0])

	const { scene } = useThrelte()

	scene.background = new Color('#333')

	let isDown = $state(false)
	let down = $state({ x: 0, y: 0 })
	let position = $state({ x: 20, y: 20 })

	interactivity()
</script>

<svelte:window
	onpointermove={(e) => {
		if (isDown && e.shiftKey) {
			position.x = e.clientX - down.x
			position.y = e.clientY - down.y
		}
	}}
	onpointerdown={(e) => {
		if (e.shiftKey) {
			e.preventDefault()
			isDown = true
			down.x = e.clientX
			down.y = e.clientY
		}
	}}
	onpointerup={() => {
		isDown = false
	}}
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

<OrbitControls enabled={!isDown} />

<T.PerspectiveCamera
	makeDefault
	position={[-2, 2, 4]}
	lookAt={[0, 0, 0]}
/>

<T.Mesh
	position.x={1.2}
	position.y={0.5}
>
	<T.BoxGeometry args={[0.4, 1, 0.7]} />
	<T.MeshStandardMaterial />

	<Edges color="black" />

	<T.Mesh position={[0, -0.35, 0.351]}>
		<T.CircleGeometry args={[0.04, 32]} />
		<T.MeshStandardMaterial />

		<Edges color="black" />
	</T.Mesh>
</T.Mesh>

<T.Group>
	<T.Mesh position={[0, 0.56, -0.16]}>
		<T.BoxGeometry args={[0.2, 1, 0.1]} />
		<T.MeshStandardMaterial />

		<Edges color="black" />
	</T.Mesh>

	<T.Mesh position={[0, 0, -0.1]}>
		<T.BoxGeometry args={[0.8, 0.1, 0.4]} />
		<T.MeshStandardMaterial />

		<Edges color="black" />
	</T.Mesh>

	<T.Mesh position.y={0.7}>
		<T.BoxGeometry args={[(1 * 16) / 9, 1, 0.1]} />
		<T.MeshStandardMaterial />
		<Edges color="black" />

		<T.Mesh
			position.z={0.0501}
			onpointerenter={() => {
				color.set([0.7, 0.2, 0])
			}}
			onpointerleave={() => {
				color.set([1, 0, 0])
			}}
		>
			<T.PlaneGeometry args={[(1 * 16) / 9 - 0.1, 1 - 0.1]} />
			<T.MeshBasicMaterial>
				<RenderTexture
					width={512 * (16 / 9)}
					height={512}
				>
					<RenderTextureScene color={color.current} />
				</RenderTexture>
			</T.MeshBasicMaterial>

			<Edges color="black" />
		</T.Mesh>
	</T.Mesh>
</T.Group>

<HUD
	left={position.x}
	top={position.y}
	width={200}
	height={200}
>
	<HUDScene />
</HUD>
