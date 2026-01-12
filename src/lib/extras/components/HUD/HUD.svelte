<script lang="ts">
	import { Vector2, Vector4 } from 'three'
	import { T, useThrelte, useTask, provideThrelte } from '$lib/core'
	import { interactivity } from '$lib/extras'
	import type { HUDProps } from './types.js'
	import { useInteractivity } from '$lib/extras/interactivity/context.svelte.js'

	let {
		autoRender = true,
		toneMapping: hudToneMapping,
		//stage = renderStage,
		ref = $bindable(),
		left = 0,
		top = 0,

		children,
		...rest
	}: HUDProps = $props()

	const { dom, renderer, toneMapping, size } = useThrelte()

	let width = $derived(rest.width ?? size.current.width)
	let height = $derived(rest.height ?? size.current.height)

	const parentInteractivity = useInteractivity()

	if (parentInteractivity) {
		const vec2 = new Vector2()

		interactivity({
			compute: (event, { pointer, raycaster }) => {
				// event.offsetX/Y: CSS px relative to canvas element
				const lx = event.offsetX - left
				const ly = event.offsetY - top

				const u = lx / width
				const t = ly / height

				// If you only want interactions inside the HUD:
				if (u < 0 || u > 1 || t < 0 || t > 1) return

				const ndcX = u * 2 - 1
				const ndcY = 1 - t * 2

				pointer.set(ndcX, ndcY)

				raycaster.setFromCamera(vec2.copy(pointer.current), camera.current)
			},
		})
	}

	const { scene, camera } = provideThrelte(dom, renderer, () => ({ width, height }))

	const originalScissor = new Vector4()
	const originalViewport = new Vector4()
	let originalScissorTest = renderer.getScissorTest()

	useTask(
		() => {
			const { autoClear } = renderer

			renderer.autoClear = false
			renderer.toneMapping = hudToneMapping ?? toneMapping.current

			renderer.getScissor(originalScissor)
			renderer.getViewport(originalViewport)
			originalScissorTest = renderer.getScissorTest()

			renderer.setViewport(left, size.current.height - height - top, width, height)
			renderer.setScissor(left, size.current.height - height - top, width, height)
			renderer.setScissorTest(true)

			renderer.render(scene, camera.current)

			// reset state
			renderer.setViewport(originalViewport)
			renderer.setScissor(originalScissor)
			renderer.setScissorTest(originalScissorTest)

			renderer.autoClear = autoClear
			renderer.toneMapping = toneMapping.current
		},
		{
			after: 'render',
			running: () => autoRender,
		}
	)
</script>

<T
	is={scene}
	bind:ref
	attach={false}
	{...rest}
>
	{@render children?.({ ref: scene })}
</T>
