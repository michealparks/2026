import { setContext, getContext } from 'svelte'
import type { Object3D, Scene } from 'three'
import type { MaybeInstance } from '../types.js'

const parentKey = Symbol('parent-context')
const parentObject3dKey = Symbol('parent-object3d-context')

interface ParentContext<Type> {
	current: MaybeInstance<Type>
}

interface ParentObject3DContext {
	current: Object3D
}

export const provideParent = <Type>(parent: () => MaybeInstance<Type>, scene: Scene) => {
	const parentObject3D = getContext<ParentObject3DContext>(parentObject3dKey)

	setContext<ParentContext<Type>>(parentKey, {
		get current() {
			return parent()
		},
	})

	setContext<ParentObject3DContext>(parentObject3dKey, {
		get current() {
			const object = parent()
			return (object as Object3D).isObject3D
				? (object as Object3D)
				: (parentObject3D.current ?? scene)
		},
	})
}

export const useParent = <Type>() => {
	return getContext<ParentContext<Type>>(parentKey)
}

/**
 * The parentObject3D context is used to access the parent `THREE.Object3D`
 * created by a `<T>` component.
 *
 * @example
 * ```svelte
 * <T.Mesh>
 *   <T.MeshStandardMaterial>
 *     <CustomComponent />
 *   </T.MeshStandardMaterial>
 * </T.Mesh>
 * ```
 *
 * The parentObject3D as retrieved inside the component `<CustomComponent>`
 * will be the mesh created by the `<T.Mesh>` component.
 */
export const useParentObject3D = () => {
	return getContext<ParentObject3DContext>(parentObject3dKey)
}
