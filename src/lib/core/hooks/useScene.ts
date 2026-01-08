import { getContext, setContext } from 'svelte'
import { Scene } from 'three'

const key = Symbol('scene-context')

export const provideScene = () => {
	const scene = new Scene()

	setContext<Scene>(key, scene)

	return scene
}

export const useScene = () => {
	return getContext<Scene>(key)
}
