import { getContext, setContext } from 'svelte'
import type { MaybeInstance } from '../fn/types.js'

interface DisposableObject {
	dispose: () => void
}

const contextName = Symbol('threlte-disposable-object-context')

type ThrelteDisposeContext = () => boolean

/**
 * Checks if the given object is a disposable object. Scenes are not disposable.
 * @param object - The object to check.
 * @returns True if the object is a disposable object, false otherwise.
 */
const isDisposableObject = (object: object): object is DisposableObject => {
	return typeof (object as DisposableObject).dispose === 'function'
}

export const provideDispose = (dispose: () => boolean | undefined) => {
	const parentDispose = getContext<ThrelteDisposeContext | undefined>(contextName)

	// We merge the local dispose with the parent dispose. If the parent dispose
	// is not set, we use true as default.
	const mergedDispose = $derived(dispose() ?? parentDispose?.() ?? true)

	setContext<ThrelteDisposeContext>(contextName, () => mergedDispose)
}

export const useDispose = <Type>(object: () => MaybeInstance<Type>) => {
	const _object = $derived(object())

	const parentDispose = getContext<ThrelteDisposeContext | undefined>(contextName)

	// We merge the local dispose with the parent dispose. If the parent dispose
	// is not set, we use true as default.
	const dispose = $derived(parentDispose?.() ?? true)

	$effect.pre(() => {
		if (!dispose) {
			return
		}

		if (!isDisposableObject(_object)) {
			return
		}

		return () => {
			_object.dispose()
		}
	})
}
