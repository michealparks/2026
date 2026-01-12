<script lang="ts">
	import { Texture, Vector2 } from 'three'
	import type { Snippet } from 'svelte'
	import { T, provideThrelte, useParentObject3D, useTask, useThrelte } from '$lib/core'
	import { useFBO, useInteractivity, interactivity } from '../../index'

	import type { IntersectionEvent } from '@threlte/extras'

	export interface RenderTextureProps extends Partial<Texture> {
		/** Optional width of the texture, defaults to viewport bounds */
		width?: number

		/** Optional height of the texture, defaults to viewport bounds */
		height?: number

		/** Optional fbo samples */
		samples?: number
		/** Optional stencil buffer, defaults to false */
		stencilBuffer?: boolean
		/** Optional depth buffer, defaults to true */
		depthBuffer?: boolean
		/** Optional generate mipmaps, defaults to false */
		generateMipmaps?: boolean

		autoRender?: boolean

		/** Optional event compute, defaults to undefined */
		compute?: (event: any, state: any, previous: any) => false | undefined

		children: Snippet<[{ ref: Texture }]>
	}

	const {
		compute,
		width = 100,
		height = 100,
		samples = 8,
		autoRender,
		stencilBuffer = false,
		depthBuffer = true,
		generateMipmaps = false,
		children,
		...props
	}: RenderTextureProps = $props()

	const { dom, renderer } = useThrelte()
	const { scene, camera } = provideThrelte(dom, renderer, () => ({ width, height }))

	const parentInteractivity = useInteractivity()

	const parent = useParentObject3D()

	if (parentInteractivity) {
		const negativeUV = new Vector2(-1, -1)
		const vec2 = new Vector2()
		let uv: Vector2 | undefined

		const onPointerLeave = () => {
			uv = negativeUV
		}

		const onPointerMove = (event: IntersectionEvent<PointerEvent>) => {
			uv = event.uv
		}

		$effect(() => {
			parentInteractivity.addInteractiveObject(parent.current)
			parent.current.addEventListener('pointerleave', onPointerLeave)
			parent.current.addEventListener('pointermove', onPointerMove)
			return () => {
				parentInteractivity.removeInteractiveObject(parent.current)
				parent.current.removeEventListener('pointerleave', onPointerLeave)
				parent.current.removeEventListener('pointermove', onPointerMove)
			}
		})

		interactivity({
			compute: (_event, { pointer, raycaster }) => {
				if (!uv) return

				pointer.set(uv.x * 2 - 1, uv.y * 2 - 1)
				raycaster.setFromCamera(vec2.copy(pointer.current), camera.current)
				uv = undefined
			},
		})
	}

	const fbo = useFBO({
		size: { width, height },
		samples,
		stencilBuffer,
		depthBuffer,
		generateMipmaps,
	})

	useTask(
		() => {
			const { autoClear } = renderer
			const { enabled: xrEnabled, isPresenting: xrPresenting } = renderer.xr
			const originalTarget = renderer.getRenderTarget()

			renderer.autoClear = true
			renderer.xr.enabled = false
			renderer.xr.isPresenting = false
			renderer.setRenderTarget(fbo)
			renderer.render(scene, camera.current)
			renderer.setRenderTarget(originalTarget)
			renderer.autoClear = autoClear
			renderer.xr.enabled = xrEnabled
			renderer.xr.isPresenting = xrPresenting
		},
		{
			running: () => autoRender ?? true,
		}
	)
</script>

<T
	is={fbo.texture}
	attach="map"
	{...props}
/>

<T
	is={scene}
	attach={false}
>
	{@render children({ ref: fbo })}
</T>
