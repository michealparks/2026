import type { Object3D } from 'three'
import { injectPlugin } from '$lib/core'
import { useInteractivity } from './context.svelte.js'
import type { ThrelteEvents } from './types.js'

export const interactivityEventNames: (keyof ThrelteEvents)[] = [
	'onclick',
	'oncontextmenu',
	'ondblclick',
	'onwheel',
	'onpointerup',
	'onpointerdown',
	'onpointerover',
	'onpointerout',
	'onpointerenter',
	'onpointerleave',
	'onpointermove',
	'onpointermissed',
]

export const injectInteractivityPlugin = (): void => {
	injectPlugin('interactivity', (args) => {
		if (!(args.ref as Object3D).isObject3D) {
			return
		}

		let hasEventHandlers = false

		for (const key in args.props) {
			if (interactivityEventNames.includes(key as keyof ThrelteEvents)) {
				hasEventHandlers = true
				break
			}
		}

		if (!hasEventHandlers) return

		const { addInteractiveObject, removeInteractiveObject } = useInteractivity()

		$effect.pre(() => {
			const { ref, props } = args
			addInteractiveObject(ref, props)
			return () => {
				removeInteractiveObject(ref)
			}
		})

		return {
			pluginProps: interactivityEventNames,
		}
	})
}
