import { getContext, setContext } from 'svelte'

export interface Size {
	width: number
	height: number
}

export interface SizeContext {
	current: Size
}

const key = Symbol('size-context')

export const provideSize = (size: () => Size) => {
	const context: SizeContext = {
		get current() {
			return size() as Size
		},
	}

	setContext<SizeContext>(key, context)

	return context
}

export const useSize = () => {
	return getContext<SizeContext>(key)
}
