<script lang="ts">
	import { T, useThrelte, useTask, type Props } from '$lib/core'
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
	import type { Event } from 'three'

	export type OrbitControlsProps = Props<OrbitControls>

	let { ref = $bindable(), children, ...props }: OrbitControlsProps = $props()

	const { camera, invalidate, shouldRender, dom } = useThrelte()

	// <HTML> sets canvas pointer-events to "none" if occluding, so events must be placed on the canvas parent.
	const controls = new OrbitControls(camera.current, dom.current)

	useTask(
		() => {
			if (shouldRender()) {
				controls.update()
			}
		},
		{
			running: () => props.autoRotate ?? props.enableDamping ?? false,
		}
	)

	$effect.pre(() => {
		controls.object = camera.current
	})

	$effect.pre(() => {
		const handleChange = (event: Event<any, OrbitControls>) => {
			invalidate()
			props.onchange?.(event)
		}

		controls.addEventListener('change', handleChange)
		return () => {
			controls.removeEventListener('change', handleChange)
		}
	})
</script>

<T
	is={controls}
	attach={false}
	bind:ref
	{...props}
>
	{@render children?.({ ref: controls })}
</T>
