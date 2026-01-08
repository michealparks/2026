<script lang="ts">
	import { provideThree } from './hooks/useThree.svelte'
	import { useTask } from './hooks/useTask.svelte'
	import { type Snippet } from 'svelte'
	import { type ShadowMapType, type ToneMapping, AgXToneMapping, PCFSoftShadowMap } from 'three'
	import { resizeRendererToDisplaySize } from './fn/resize'
	import { useCamera } from './hooks/useCamera.svelte'

	interface Props {
		dpr?: number
		toneMapping?: ToneMapping
		shadows?: false | ShadowMapType
		autoRender?: boolean
		children: Snippet
	}

	let dom = $state.raw<HTMLElement>()

	let {
		dpr,
		toneMapping,
		shadows = PCFSoftShadowMap,
		autoRender: autoRenderProp = true,
		children,
	}: Props = $props()

	const canvasSize = $state({ width: 0, height: 0 })
	const domSize = { width: 0, height: 0 }

	const { schedule, renderer, autoRender, invalidate } = provideThree(() => canvasSize)
	const { managedCameras } = useCamera()

	$effect.pre(() => {
		autoRender.current = autoRenderProp
	})

	$effect.pre(() => {
		renderer.setPixelRatio(dpr ?? window.devicePixelRatio)
	})

	$effect.pre(() => {
		renderer.toneMapping = toneMapping ?? AgXToneMapping
	})

	$effect.pre(() => {
		renderer.shadowMap.enabled = shadows !== false

		if (shadows !== false) {
			renderer.shadowMap.type = shadows
		}
	})
</script>

<div
	bind:this={dom}
	{@attach (ref) => {
		const canvasObserver = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect
			canvasSize.width = width
			canvasSize.height = height
		})

		const domObserver = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect
			domSize.width = width
			domSize.height = height
		})

		canvasObserver?.observe(renderer.domElement)
		domObserver?.observe(ref)

		ref.append(renderer.domElement)

		domSize.width = ref.clientWidth
		domSize.height = ref.clientHeight

		let then = performance.now()

		renderer.setAnimationLoop((now) => {
			const dt = now - then
			then = now

			const changed = resizeRendererToDisplaySize(domSize, canvasSize, renderer, managedCameras)

			if (changed) invalidate()

			schedule.run(dt)
		})

		return () => {
			domObserver.disconnect()
			canvasObserver.disconnect()
			renderer.setAnimationLoop(null)
			renderer.domElement.remove()
			renderer.dispose()
		}
	}}
>
	{@render children?.()}
</div>

<style>
	div {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
