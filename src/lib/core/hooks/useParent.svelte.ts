import { setContext, getContext } from 'svelte'
import type { MaybeInstance } from '../util/types.js'

const key = Symbol('parent-context')

interface Context<Type> {
	current: MaybeInstance<Type>
}

export const provideParent = <Type>(parent: () => MaybeInstance<Type>) => {
	setContext<Context<Type>>(key, {
		get current() {
			return parent()
		},
	})
}

export const useParent = <Type>() => {
	return getContext<Context<Type>>(key)
}
