const uvCompute = React.useCallback((event, state, previous) => {
	// Since this is only a texture it does not have an easy way to obtain the parent, which we
	// need to transform event coordinates to local coordinates. We use r3f internals to find the
	// next Object3D.
	let parent = (fbo.texture as any)?.__r3f.parent?.object
	while (parent && !(parent instanceof THREE.Object3D)) {
		parent = parent.__r3f.parent?.object
	}
	if (!parent) return false
	// First we call the previous state-onion-layers compute, this is what makes it possible to nest portals
	if (!previous.raycaster.camera)
		previous.events.compute(event, previous, previous.previousRoot?.getState())
	// We run a quick check against the parent, if it isn't hit there's no need to raycast at all
	const [intersection] = previous.raycaster.intersectObject(parent)
	if (!intersection) return false
	// We take that hits uv coords, set up this layers raycaster, et voilà, we have raycasting on arbitrary surfaces
	const uv = intersection.uv
	if (!uv) return false
	state.raycaster.setFromCamera(state.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1), state.camera)
}, [])
