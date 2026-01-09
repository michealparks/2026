<script lang="ts">
	import type { Snippet } from 'svelte'
	import {
		type ShadowMapType,
		type ToneMapping,
		Cache,
		PCFSoftShadowMap,
		WebGLRenderer,
		AgXToneMapping,
	} from 'three'
	import { resizeRendererToDisplaySize } from './util/resize.js'
	import { provideThrelte } from './hooks/useThrelte.svelte.js'
	import { useTask } from './hooks/useTask.svelte.js'
	import { managedCameras } from './hooks/useCamera.svelte.js'

	interface Props {
		dpr?: number
		toneMapping?: ToneMapping
		shadows?: false | ShadowMapType
		autoRender?: boolean
		renderMode?: 'always' | 'on-demand' | 'manual'
		renderer?: WebGLRenderer
		cache?: boolean
		children: Snippet
	}

	let dom = $state.raw<HTMLElement>()

	let { children, ...props }: Props = $props()

	const canvasSize = $state({ width: 0, height: 0 })
	const domSize = { width: 0, height: 0 }

	const renderer = $derived(
		props.renderer ??
			new WebGLRenderer({
				powerPreference: 'high-performance',
				antialias: true,
				alpha: true,
			})
	)

	const { scene, camera, invalidated, schedule, autoRender, shouldRender } = provideThrelte({
		renderer: () => renderer,
		dom: () => dom!,
		size: () => canvasSize,
		autoRender: () => props.autoRender ?? true,
		renderMode: () => props.renderMode ?? 'on-demand',
		dpr: () => props.dpr ?? window.devicePixelRatio,
		toneMapping: () => props.toneMapping ?? AgXToneMapping,
		shadows: () => props.shadows ?? PCFSoftShadowMap,
	})

	$effect.pre(() => {
		Cache.enabled = props.cache ?? true
	})

	useTask(
		() => {
			if (shouldRender()) {
				renderer.render(scene, camera.current)
			}

			invalidated.current = false
		},
		{
			tag: 'render',
			running: () => autoRender.current,
		}
	)
</script>

<div
	bind:this={dom}
	{@attach (ref) => {
		const canvas = renderer.domElement

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

		canvasObserver?.observe(canvas)
		domObserver?.observe(ref)

		ref.append(canvas)

		domSize.width = ref.clientWidth
		domSize.height = ref.clientHeight

		let then = performance.now()

		renderer.setAnimationLoop((now) => {
			const dt = now - then
			then = now

			const changed = resizeRendererToDisplaySize(domSize, canvasSize, renderer, managedCameras)

			if (changed) {
				invalidated.current = true
			}

			schedule.run(dt)
		})

		return () => {
			domObserver.disconnect()
			canvasObserver.disconnect()

			renderer.setAnimationLoop(null)

			canvas.remove()
			renderer.dispose()
		}
	}}
>
	{#if dom}
		{@render children?.()}
	{/if}
</div>

<style>
	div {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
