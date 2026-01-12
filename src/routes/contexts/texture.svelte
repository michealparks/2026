<script lang="ts">
	import { Color, Mesh } from 'three'
	import { T, useTask, useThrelte } from '$lib/core'
	import { Spring } from 'svelte/motion'

	let { color = [1, 1, 1] }: { color?: [number, number, number] } = $props()

	const mesh = new Mesh()

	const { scene } = useThrelte()

	scene.background = new Color()
	$effect(() => {
		;(scene.background as Color)?.setRGB(...color)
	})

	const scale = new Spring(1)

	useTask((dt) => {
		const delta = dt / 1000
		mesh.rotation.x += delta
		mesh.rotation.y += delta
	})
</script>

<T.PerspectiveCamera
	makeDefault
	position={[2, 2, 2]}
	lookAt={[0, 0, 0]}
/>

<T.DirectionalLight />
<T.AmbientLight />

<T
	is={mesh}
	scale={scale.current}
	onpointerenter={() => scale.set(1.5)}
	onpointerleave={() => scale.set(1)}
>
	<T.BoxGeometry />
	<T.MeshStandardMaterial color="blue" />
</T>
