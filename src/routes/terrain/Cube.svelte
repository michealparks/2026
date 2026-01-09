<script lang="ts">
	import { Mesh } from 'three'
	import { T, useTask } from '$lib/core'

	const mesh = new Mesh()

	let running = $state(true)
	let value = Math.random() * 1000

	mesh.quaternion.random()

	useTask((dt) => {
		mesh.rotation.x += dt / 1000
		mesh.rotation.y += dt / 1000
	})

	mesh.position.x = Math.sin(value / 200)

	useTask(
		(dt) => {
			value += dt
			mesh.position.x = Math.sin(value / 200)
		},
		{ running: () => running }
	)
</script>

<T
	is={mesh}
	position.z={(Math.random() - 0.5) * 20}
	position.y={0.75}
	castShadow
	receiveShadow
>
	<T.BoxGeometry args={[0.5, 0.7, 0.8]} />
	<T.MeshStandardMaterial
		color="red"
		roughness={0.2}
	/>
</T>
