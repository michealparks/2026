import type { Mesh, Object3D, BufferGeometry, Material } from 'three'
import type { AttachFunction, MaybeInstance } from '../fn/types.js'

export const useAttach = <Type>(
	object: () => MaybeInstance<Type>,
	parent: () => MaybeInstance<Type>,
	attach: () => false | Object3D | AttachFunction<Type> | MaybeInstance<Type> | string
) => {
	$effect.pre(() => {
		const _object = object()
		const _attach = attach()

		// Object3d
		if ((_attach as Object3D).isObject3D && (_object as Object3D).isObject3D) {
			const object3D = _attach as Object3D
			object3D.add(_object as Object3D)
			return () => {
				object3D.remove(_object as Object3D)
			}

			// Geometry
		} else if ((_attach as Mesh).isMesh && (_object as BufferGeometry).isBufferGeometry) {
			const mesh = _attach as Mesh
			const geometry = mesh.geometry
			mesh.geometry = _object as BufferGeometry
			return () => {
				mesh.geometry = geometry
			}

			// Material
		} else if ((_attach as Mesh).isMesh && (_object as Material).isMaterial) {
			const mesh = _attach as Mesh
			const material = mesh.material
			mesh.material = _object as Material
			return () => {
				mesh.material = material
			}

			// No attach
		} else if (_attach === false) {
			return

			// Prop
		} else if (typeof _attach === 'string') {
			const _parent = parent()
			const prev = _parent[_attach]
			_parent[_attach] = _object
			return () => {
				_parent[_attach] = prev
			}

			// Function
		} else if (typeof _attach === 'function') {
			// Error
		} else {
			console.error(`An invalid attachment was attempted for an object.`, _object)
		}
	})
}
