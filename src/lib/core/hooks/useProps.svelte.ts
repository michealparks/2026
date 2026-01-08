import type { MaybeInstance } from '../fn/types'

export const useProps = <Type>(
	object: () => MaybeInstance<Type>,
	props: () => Record<string, unknown>
) => {
	const _object = $derived(object())
	const _props = $derived(props())

	$effect.pre(() => {
		for (const rawKey in _props) {
			const value = _props[rawKey]
			let key = rawKey
			let obj = _object

			if (key.includes('.')) {
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

			if (typeof prop === 'object') {
				if (Array.isArray(value) && 'fromArray' in prop) {
					prop.fromArray(value)
				} else if ('set' in prop) {
					prop.set(value)
				}
			} else if (typeof prop === 'function') {
				if (Array.isArray(value)) {
					prop.call(_object, ...value)
				} else {
					prop.call(_object, value)
				}
			} else {
				obj[key] = value
			}
		}
	})
}
