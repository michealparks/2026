import { getContext, setContext } from 'svelte'

const key = Symbol('dom-context')

export const provideDOM = (dom: HTMLElement) => {
	setContext<HTMLElement>(key, dom)
	return dom
}

export const useDOM = () => {
	return getContext<HTMLElement>(key)
}
