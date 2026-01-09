<script>
	import { useTask, useThrelte } from '$lib/core'
	import { useHDR } from '$lib/extras'
	import {
		HalfFloatType,
		AdditiveBlending,
		RepeatWrapping,
		DoubleSide,
		Scene,
		Vector2,
		DirectionalLight,
		BoxGeometry,
		MeshStandardMaterial,
		OrthographicCamera,
		Mesh,
		NearestFilter,
		RGBAFormat,
		FloatType,
		WebGLRenderTarget,
		DepthTexture,
		UnsignedByteType,
		PlaneGeometry,
		MeshBasicMaterial,
		ShaderMaterial,
		TextureLoader,
	} from 'three'
	import depthVertexShader from './depth-vertex.glsl?raw'
	import depthFragmentShader from './depth-fragment.glsl?raw'

	import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
	import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'

	const { scene, camera, renderer } = useThrelte()

	useHDR('/hdr/rosendal_park_sunset_1k.hdr')

	const renderTargetOptions = {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBAFormat,
		type: FloatType,
	}
	const renderTarget_ = new WebGLRenderTarget(
		window.innerWidth,
		window.innerHeight,
		renderTargetOptions
	)
	renderTarget_.depthTexture = new DepthTexture(window.innerWidth, window.innerHeight)

	const depthOptions = {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBAFormat,
		type: UnsignedByteType,
	}
	const depthCopy_ = new WebGLRenderTarget(window.innerWidth, window.innerHeight, depthOptions)

	const depthCopyMaterial_ = new ShaderMaterial({
		uniforms: { depthTexture: { value: null } },
		vertexShader: depthVertexShader,
		fragmentShader: depthFragmentShader,
	})

	depthCopyMaterial_.depthTest = false
	depthCopyMaterial_.depthWrite = false

	const quadGeo = new PlaneGeometry(2, 2)
	const quadMaterial = new MeshBasicMaterial({
		depthTest: false,
		depthWrite: false,
	})
	const quad = new Mesh(quadGeo, quadMaterial)

	const colourCopyMaterial_ = quadMaterial
	const viewScene_ = new Scene()
	const viewCamera_ = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
	const viewQuad_ = quad

	viewScene_.add(quad)

	const transparentScene_ = new Scene()

	// Create a ground plane
	const planeGeometry = new PlaneGeometry(10, 10)
	const planeMaterial = new MeshStandardMaterial({
		color: 0x808080,
		metalness: 0,
		roughness: 0.8,
	})
	const plane = new Mesh(planeGeometry, planeMaterial)

	plane.rotation.x = -Math.PI / 2
	plane.receiveShadow = true
	plane.castShadow = false
	scene.add(plane)

	// Create a cube wall
	const wallGeometry = new BoxGeometry(10, 3, 1)
	const wall = new Mesh(wallGeometry, planeMaterial)
	wall.position.set(0, 1.5, -5)
	wall.receiveShadow = true
	wall.castShadow = true
	scene.add(wall)

	// Create a cube in the middle
	const cubeGeometry = new BoxGeometry(1, 1, 1)
	const cube = new Mesh(cubeGeometry, planeMaterial)
	cube.position.set(0, 0.5, 0)
	cube.receiveShadow = true
	cube.castShadow = true
	scene.add(cube)

	// Create a light
	const light = new DirectionalLight(0xffffff, 1)
	light.position.set(2, 4, 1)
	light.target.position.set(0, 0, 0)
	light.castShadow = true
	scene.add(light)
	scene.add(light.target)

	const textureLoader = new TextureLoader()

	// Create a forcefield thing
	const forceFieldMaterial = new ShaderMaterial({
		uniforms: {
			depthTexture: { value: depthCopy_.texture },
			cameraNearFar: { value: new Vector2(camera.current.near, camera.current.far) },
			resolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
			map: { value: textureLoader.load('./resources/textures/circle.ktx2') },
			time: { value: 0 },
		},
		vertexShader: depthVertexShader,
		fragmentShader: depthFragmentShader,
	})

	forceFieldMaterial.uniforms.map.value.wrapS = RepeatWrapping
	forceFieldMaterial.uniforms.map.value.wrapT = RepeatWrapping
	forceFieldMaterial.transparent = true
	forceFieldMaterial.side = DoubleSide
	forceFieldMaterial.depthTest = true
	forceFieldMaterial.depthWrite = false
	forceFieldMaterial.blending = AdditiveBlending
	const forceField = new Mesh(cubeGeometry, forceFieldMaterial)
	forceField.scale.setScalar(4)

	transparentScene_.add(forceField)

	camera.current.position.set(-5, 5, 10)

	const options = {
		format: RGBAFormat,
		type: HalfFloatType,
		minFilter: NearestFilter,
		magFilter: NearestFilter,
	}
	const rt = new WebGLRenderTarget(window.innerWidth, window.innerHeight, options)
	rt.depthTexture = new DepthTexture(window.innerWidth, window.innerHeight)

	const composer = new EffectComposer(renderer, rt)

	const renderMainPass = (readBuffer) => {
		// Renders the scene and depth
		renderer.setRenderTarget(readBuffer)
		renderer.render(scene, camera.current)
		renderer.setRenderTarget(null)

		// Copy the depth texture
		depthCopyMaterial_.uniforms.depthTexture.value = readBuffer.depthTexture
		viewQuad_.material = depthCopyMaterial_
		viewQuad_.position.set(0, 0, -1)
		viewQuad_.scale.setScalar(1)
		renderer.setRenderTarget(depthCopy_)
		renderer.render(viewScene_, viewCamera_)
		renderer.setRenderTarget(null)
		viewQuad_.material = colourCopyMaterial_

		// Render the transparent scene
		renderer.autoClear = false
		renderer.setRenderTarget(readBuffer)
		renderer.render(transparentScene_, camera.current)
		renderer.setRenderTarget(null)

		// Show the rendered colour and depth on the screen
		// this.#viewQuad_.material.map = this.#renderTarget_.texture;
		// this.#viewQuad_.position.set(0, 0, -1);
		// this.#viewQuad_.scale.setScalar(1);
		// this.Renderer.autoClear = false;
		// this.Renderer.render(this.#viewScene_, this.#viewCamera_);

		// this.#viewQuad_.material.map = this.#depthCopy_.texture;
		// this.#viewQuad_.position.set(0.375, -0.375, -1);
		// this.#viewQuad_.scale.setScalar(0.25);
		// this.Renderer.render(this.#viewScene_, this.#viewCamera_);

		renderer.autoClear = true
	}

	let elapsed = 0
	useTask((dt) => {
		elapsed += dt
		transparentScene_.traverse((obj) => {
			if (obj.isMesh) {
				if (obj.material.uniforms) {
					obj.material.uniforms.time.value = elapsed
				}
			}
		})

		renderMainPass()
	})

	// onRender() {
	//   // Renders the scene and depth
	//   this.Renderer.setRenderTarget(this.#renderTarget_);
	//   this.Renderer.render(this.Scene, this.Camera);
	//   this.Renderer.setRenderTarget(null);

	//   // Copy the depth texture
	//   this.#depthCopyMaterial_.uniforms.depthTexture.value = this.#renderTarget_.depthTexture;
	//   this.#viewQuad_.material = this.#depthCopyMaterial_;
	//   this.#viewQuad_.position.set(0, 0, -1);
	//   this.#viewQuad_.scale.setScalar(1);
	//   this.Renderer.setRenderTarget(this.#depthCopy_);
	//   this.Renderer.render(this.#viewScene_, this.#viewCamera_);
	//   this.Renderer.setRenderTarget(null);
	//   this.#viewQuad_.material = this.#colourCopyMaterial_;

	//   // Render the transparent scene
	//   this.Renderer.autoClear = false;
	//   this.Renderer.setRenderTarget(this.#renderTarget_);
	//   this.Renderer.render(this.#transparentScene_, this.Camera);
	//   this.Renderer.setRenderTarget(null);

	//   // Show the rendered colour and depth on the screen
	//   this.#viewQuad_.material.map = this.#renderTarget_.texture;
	//   this.#viewQuad_.position.set(0, 0, -1);
	//   this.#viewQuad_.scale.setScalar(1);
	//   this.Renderer.autoClear = false;
	//   this.Renderer.render(this.#viewScene_, this.#viewCamera_);

	//   // this.#viewQuad_.material.map = this.#depthCopy_.texture;
	//   // this.#viewQuad_.position.set(0.375, -0.375, -1);
	//   // this.#viewQuad_.scale.setScalar(0.25);
	//   // this.Renderer.render(this.#viewScene_, this.#viewCamera_);

	//   this.Renderer.autoClear = true;
	// }
</script>
