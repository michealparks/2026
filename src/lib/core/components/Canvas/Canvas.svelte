<script lang="ts">
	import type { Snippet } from 'svelte'
	import { WebGLRenderer } from 'three'
	import type { CanvasProps } from './types'
	import Provider from './Provider.svelte'

	interface Props extends CanvasProps {
		children: Snippet
	}

	let dom = $state.raw<HTMLElement>()

	let { children, ...props }: Props = $props()

	const renderer = $derived(
		props.renderer ??
			new WebGLRenderer({
				powerPreference: 'high-performance',
				antialias: true,
				alpha: true,
			})
	)
</script>

<div
	bind:this={dom}
	{@attach (ref) => {
		const canvas = renderer.domElement
		canvas.style.width = '100%'
		canvas.style.height = '100%'
		ref.append(canvas)

		return () => {
			canvas.remove()
			renderer.dispose()
		}
	}}
>
	{#if dom}
		<Provider
			{dom}
			{renderer}
			{...props}
		>
			{@render children?.()}
		</Provider>
	{/if}
</div>

<style>
	div {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
