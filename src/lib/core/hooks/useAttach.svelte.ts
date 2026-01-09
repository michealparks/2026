import type { Mesh, Object3D, BufferGeometry, Material } from 'three'
import type { AttachFunction, MaybeInstance } from '../util/types.js'

export const useAttach = <Type>(
	object: () => MaybeInstance<Type>,
	parent: () => MaybeInstance<Type>,
	attach: () => false | Object3D | AttachFunction<Type> | MaybeInstance<Type> | string
) => {
	$effect.pre(() => {
		const _object = object()
		const _attach = attach()

		// If the object and attach target are both Object3Ds...
		if ((_attach as Object3D).isObject3D && (_object as Object3D).isObject3D) {
			const object3D = _attach as Object3D
			object3D.add(_object as Object3D)
			return () => {
				object3D.remove(_object as Object3D)
			}

			// If the attach target is a Mesh and the object is a BufferGeometry...
		} else if ((_attach as Mesh).isMesh && (_object as BufferGeometry).isBufferGeometry) {
			const mesh = _attach as Mesh
			const geometry = mesh.geometry
			mesh.geometry = _object as BufferGeometry
			return () => {
				mesh.geometry = geometry
			}

			// If the attach target is a Mesh and the object is a Material...
		} else if ((_attach as Mesh).isMesh && (_object as Material).isMaterial) {
			const mesh = _attach as Mesh
			const material = mesh.material
			mesh.material = _object as Material
			return () => {
				mesh.material = material
			}

			// Explicitly do not attach...
		} else if (_attach === false) {
			return

			// If the attach target is a property key...
		} else if (typeof _attach === 'string') {
			const _parent = parent()
			const prev = _parent[_attach]
			_parent[_attach] = _object
			return () => {
				_parent[_attach] = prev
			}

			// If attach is a function...
		} else if (typeof _attach === 'function') {
			// Error
		} else {
			console.error(`An invalid attachment was attempted for an object.`, _object)
		}
	})
}
