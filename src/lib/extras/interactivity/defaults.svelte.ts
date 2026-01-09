import { useThrelte } from '$lib/core'
import { Vector2 } from 'three'
import type { ComputeFunction } from './context.svelte.js'

const vec2 = new Vector2()

export const getDefaultComputeFunction = (target: () => HTMLElement): ComputeFunction => {
	const { camera } = useThrelte()
	const _target = $derived(target())

	let width = _target.clientWidth
	let height = _target.clientHeight

	const resizeObserver = new ResizeObserver(([entry]) => {
		width = entry.contentRect.width
		height = entry.contentRect.height
	})

	$effect(() => {
		if (!_target) return
		resizeObserver.observe(_target)
		return () => resizeObserver.disconnect()
	})

	return (event, state) => {
		state.pointer.set((event.offsetX / width) * 2 - 1, -(event.offsetY / height) * 2 + 1)
		state.raycaster.setFromCamera(vec2.copy(state.pointer.current), camera.current)
	}
}
