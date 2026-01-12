<script>
	import { Color, Mesh } from 'three'
	import { T, useTask, useThrelte } from '$lib/core'
	import { RenderTexture, OrbitControls } from '$lib/extras'
	import Texture from './texture.svelte'
	import { Spring } from 'svelte/motion'

	const mesh = new Mesh()

	const { scene } = useThrelte()

	const scale = new Spring(1)

	scene.background = new Color('purple')

	useTask((dt) => {
		const delta = dt / 1000
		mesh.rotation.y += delta
	})
</script>

<T.OrthographicCamera
	makeDefault
	position={[1, 1, 1]}
	near={-100}
	far={100}
	zoom={80}
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
	<T.MeshStandardMaterial>
		<RenderTexture
			width={100}
			height={100}
		>
			<Texture />
		</RenderTexture>
	</T.MeshStandardMaterial>
</T>
