import { useThrelte } from '$lib/core'
import { DataTexture, EquirectangularReflectionMapping } from 'three'
import { HDRLoader } from 'three/examples/jsm/Addons.js'

const loader = new HDRLoader()

export const useHDR = (src: (() => string) | string) => {
	const { scene } = useThrelte()
	let hdr = $state<DataTexture>()

	$effect.pre(() => {
		const url = typeof src === 'function' ? src() : src
		loader.load(url, (data) => {
			hdr = data

			data.mapping = EquirectangularReflectionMapping
			scene.background = data
			scene.environment = data
		})
	})

	return {
		get current() {
			return hdr
		},
	}
}
