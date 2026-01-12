<script
	lang="ts"
	generics="Type extends WebGLRenderer | WebGPURenderer = WebGLRenderer"
>
	import { Cache, type WebGLRenderer, AgXToneMapping, PCFSoftShadowMap } from 'three'
	import type { Snippet } from 'svelte'
	import type { WebGPURenderer } from 'three/webgpu'
	import { provideThrelte } from '../../hooks/useThrelte.svelte'
	import { useTask } from '../../hooks/useTask.svelte'
	import type { CanvasProps } from './types'

	interface Props extends CanvasProps<Type> {
		dom: HTMLElement
		renderer: Type
		children: Snippet
	}

	const { dom, renderer, cache, children, ...props }: Props = $props()

	let size = $state({ width: 0, height: 0 })

	const {
		scene,
		camera,
		schedule,
		invalidated,
		autoRender,
		shadows,
		renderMode,
		toneMapping,
		dpr,
		shouldRender,
	} = provideThrelte<Type>(dom, renderer, () => size)

	$effect.pre(() => {
		Cache.enabled = cache ?? true
	})

	$effect.pre(() => {
		autoRender.current = props.autoRender ?? true
	})

	$effect.pre(() => {
		renderMode.current = props.renderMode ?? 'on-demand'
	})

	$effect.pre(() => {
		toneMapping.current = props.toneMapping ?? AgXToneMapping
	})

	$effect.pre(() => {
		shadows.current = props.shadows ?? PCFSoftShadowMap
	})

	$effect.pre(() => {
		dpr.current = props.dpr ?? window.devicePixelRatio
	})

	const canvas = renderer.domElement

	let needsResize = false

	$effect.pre(() => {
		const canvasObserver = new ResizeObserver(([entry]) => {
			size.width = entry.contentRect.width
			size.height = entry.contentRect.height

			needsResize = true
			invalidated.current = true
		})

		try {
			canvasObserver.observe(canvas, { box: 'device-pixel-content-box' })
		} catch {
			canvasObserver.observe(canvas, { box: 'content-box' })
		}

		return () => {
			canvasObserver.disconnect()
		}
	})

	let then = performance.now()

	$effect.pre(() => {
		renderer.setAnimationLoop((now) => {
			const dt = now - then
			then = now

			if (needsResize) {
				renderer.setSize(size.width, size.height, false)
				needsResize = false
			}

			schedule.run(dt)
		})

		return () => {
			renderer.setAnimationLoop(null)
		}
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

{@render children()}
