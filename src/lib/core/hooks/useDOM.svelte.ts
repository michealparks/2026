import { getContext, setContext } from 'svelte'

const key = Symbol('dom-context')

export interface DOMContext {
	current: HTMLElement
}

export const provideDOM = (dom: () => HTMLElement) => {
	const context: DOMContext = {
		get current() {
			return dom()
		},
	}

	setContext(key, context)

	return context
}

export const useDOM = () => {
	return getContext<DOMContext>(key)
}
