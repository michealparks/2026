<script lang="ts">
	import './layout.css'
	import favicon from '$lib/assets/favicon.svg'
	import { Canvas } from '$lib/core'

	let { children } = $props()
</script>

<svelte:head
	><link
		rel="icon"
		href={favicon}
	/></svelte:head
>

<div class="app">
	<Canvas>
		{@render children()}
	</Canvas>
</div>

<style>
	.app {
		height: 100vh;
		background-color: #0a0a0f;
	}
</style>
