import type { EventDispatcher } from 'three'
import { untrack } from 'svelte'
import type { MaybeInstance } from '../util/types.js'
import { useThrelte } from './useThrelte.svelte.js'

export const useProps = <Type>(
	object: () => MaybeInstance<Type>,
	props: () => Record<string, unknown>
) => {
	const { invalidate } = useThrelte()
	const _object = object()
	const _props = props()

	$effect.pre(() => {
		_object
		_props.length

		return untrack(() => {
			for (const rawKey in _props) {
				$effect.pre(() => {
					let key = rawKey
					let obj = _object

					const value = _props[rawKey]
					const isPierced = key.includes('.')

					if (isPierced) {
						const path = key.split('.')

						while (path.length > 1) {
							const item = path.shift()

							if (!item) {
								throw new Error(`${key} is an incomplete prop`)
							}

							obj = obj[item]
						}

						key = path.shift()
					}

					const prop = _object[key]

					/**
					 * If we can determine that this is an event listener prop,
					 * attach it.
					 */
					if (
						typeof value === 'function' &&
						key.startsWith('on') &&
						!isPierced &&
						'addEventListener' in (_object as EventDispatcher)
					) {
						const dispatcher = _object as EventDispatcher
						dispatcher.addEventListener(key.slice(2), value)

						return () => {
							dispatcher.removeEventListener(key.slice(2), value)
						}
					}

					if (typeof prop === 'object') {
						if (Array.isArray(value) && 'fromArray' in prop) {
							prop.fromArray(value)
						} else if ((typeof value === 'object' || typeof value === 'string') && 'set' in prop) {
							prop.set(value)
						} else if (typeof value === 'number' && 'setScalar' in prop) {
							prop.setScalar(value)
						}

						invalidate()
						return
					}

					if (typeof prop === 'function') {
						if (Array.isArray(value)) {
							prop.call(_object, ...value)
						} else {
							prop.call(_object, value)
						}

						invalidate()
						return
					}

					{
						obj[key] = value
						invalidate()
					}
				})
			}
		})
	})
}
