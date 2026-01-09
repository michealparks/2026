import * as THREE from 'three'

import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js'
import { CopyShader } from 'three/addons/shaders/CopyShader.js'

const VSH_GENERIC = `

out vec2 vUvs;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUvs = uv;
}
`

const FSH_DOWNSAMPLE_ = `

uniform sampler2D frameTexture;
uniform bool useKaris;
uniform vec2 resolution;
uniform float radius;
uniform mat4 colourMatrix;

varying vec2 vUvs;

float Luminance(vec4 c) {
  return max(1.0, dot(c.xyz, vec3(0.2627, 0.6780, 0.0593)));
}

vec4 KarisAverage(vec4 sample1, vec4 sample2, vec4 sample3, vec4 sample4) {
  float w1 = 1.0 / Luminance(sample1);
  float w2 = 1.0 / Luminance(sample2);
  float w3 = 1.0 / Luminance(sample3);
  float w4 = 1.0 / Luminance(sample4);
  float totalWeight = 1.0 / (w1 + w2 + w3 + w4);

  return (sample1 * w1 +
          sample2 * w2 +
          sample3 * w3 +
          sample4 * w4) * totalWeight;
}

void main() {
  vec2 texelSize = radius / resolution;

  vec4 A = texture(frameTexture, vUvs + texelSize * vec2(-1.0, -1.0));
  vec4 B = texture(frameTexture, vUvs + texelSize * vec2( 0.0, -1.0));
  vec4 C = texture(frameTexture, vUvs + texelSize * vec2( 1.0, -1.0));
  vec4 D = texture(frameTexture, vUvs + texelSize * vec2(-0.5, -0.5));
  vec4 E = texture(frameTexture, vUvs + texelSize * vec2( 0.5, -0.5));
  vec4 F = texture(frameTexture, vUvs + texelSize * vec2(-1.0,  0.0));
  vec4 G = texture(frameTexture, vUvs                               );
  vec4 H = texture(frameTexture, vUvs + texelSize * vec2( 1.0,  0.0));
  vec4 I = texture(frameTexture, vUvs + texelSize * vec2(-0.5,  0.5));
  vec4 J = texture(frameTexture, vUvs + texelSize * vec2( 0.5,  0.5));
  vec4 K = texture(frameTexture, vUvs + texelSize * vec2(-1.0,  1.0));
  vec4 L = texture(frameTexture, vUvs + texelSize * vec2( 0.0,  1.0));
  vec4 M = texture(frameTexture, vUvs + texelSize * vec2( 1.0,  1.0));

  vec2 div = vec2(0.5, 0.125);

  vec4 colour = vec4(0.0);
  if (useKaris) {
    colour = KarisAverage(D, E, I, J) * div.x;
    colour += KarisAverage(A, B, G, F) * div.y;
    colour += KarisAverage(B, C, H, G) * div.y;
    colour += KarisAverage(F, G, L, K) * div.y;
    colour += KarisAverage(G, H, M, L) * div.y;

    vec4 transformedColour = colourMatrix * vec4(colour.xyz, 1.0);
    colour = vec4(transformedColour.xyz, colour.w);
  } else {
    div *= 0.25;

    colour = (D + E + I + J) * div.x;
    colour += (A + B + G + F) * div.y;
    colour += (B + C + H + G) * div.y;
    colour += (F + G + L + K) * div.y;
    colour += (G + H + M + L) * div.y;
  }

  gl_FragColor = colour;
}
`

const FSH_UPSAMPLE_ = `
uniform sampler2D frameTexture;
uniform sampler2D mipTexture;
uniform vec2 resolution;
uniform float radius;

varying vec2 vUvs;

void main() {
  // The filter kernel is applied with a radius, specified in texture
  // coordinates, so that the radius will vary across mip resolutions.
  float x = radius / resolution.x;
  float y = radius / resolution.y;

  // Take 9 samples around current texel:
  // a - b - c
  // d - e - f
  // g - h - i
  // === ('e' is the current texel) ===
  vec4 a = texture(frameTexture, vec2(vUvs.x - x, vUvs.y + y));
  vec4 b = texture(frameTexture, vec2(vUvs.x,     vUvs.y + y));
  vec4 c = texture(frameTexture, vec2(vUvs.x + x, vUvs.y + y));

  vec4 d = texture(frameTexture, vec2(vUvs.x - x, vUvs.y));
  vec4 e = texture(frameTexture, vec2(vUvs.x,     vUvs.y));
  vec4 f = texture(frameTexture, vec2(vUvs.x + x, vUvs.y));

  vec4 g = texture(frameTexture, vec2(vUvs.x - x, vUvs.y - y));
  vec4 h = texture(frameTexture, vec2(vUvs.x,     vUvs.y - y));
  vec4 i = texture(frameTexture, vec2(vUvs.x + x, vUvs.y - y));

  // Apply weighted distribution, by using a 3x3 tent filter:
  //  1   | 1 2 1 |
  // -- * | 2 4 2 |
  // 16   | 1 2 1 |
  vec4 colour = e*4.0;
  colour += (b+d+f+h)*2.0;
  colour += (a+c+g+i);
  colour *= 1.0 / 16.0;
  colour += texture(mipTexture, vUvs);

  gl_FragColor = colour;
}
`

const COMPOSITE_FSH_ = `
uniform sampler2D frameTexture;
uniform sampler2D bloomTexture;
uniform float bloomStrength;
uniform float bloomMix;

varying vec2 vUvs;

void main() {
  vec2 uvs = vUvs;

  vec4 textureSample = texture(frameTexture, uvs);
  vec4 bloomSample = texture(bloomTexture, uvs);

  vec4 colour = mix(textureSample, bloomStrength * bloomSample, bloomMix);

  gl_FragColor = colour;
}
`

const DOWNSAMPLE_SHADER = {
	uniforms: {
		frameTexture: { value: null },
		useKaris: { value: false },
		resolution: { value: new THREE.Vector2() },
		radius: { value: 1 },
		colourMatrix: { value: new THREE.Matrix4() },
	},
	vertexShader: VSH_GENERIC,
	fragmentShader: FSH_DOWNSAMPLE_,
}

const UPSAMPLE_SHADER = {
	uniforms: {
		frameTexture: { value: null },
		mipTexture: { value: null },
		radius: { value: 1 },
		resolution: { value: new THREE.Vector2() },
	},
	vertexShader: VSH_GENERIC,
	fragmentShader: FSH_UPSAMPLE_,
}

const COMPOSITE_SHADER = {
	uniforms: {
		frameTexture: { value: null },
		bloomTexture: { value: null },
		bloomStrength: { value: 1.0 },
		bloomMix: { value: 0.03 },
	},
	vertexShader: VSH_GENERIC,
	fragmentShader: COMPOSITE_FSH_,
}

class BloomPassOptions {
	constructor() {
		this.render = {
			contrast: 1,
			brightness: 1,
			saturation: 1,
			// TODO: Useful?
			downRadius: 1,
			upRadius: 1,
		}
		this.composite = {
			mixFactor: 0.03,
			strength: 1,
		}
		this.setup = {
			levels: 4,
		}
	}
}

class BloomPass extends Pass {
	#quad_ = null
	#passes_ = {}
	#targets_ = {}
	#settings_ = null

	constructor(options) {
		super()

		this.needsSwap = false
		this.#settings_ = options instanceof BloomPassOptions ? options : new BloomPassOptions()

		this.#quad_ = new FullScreenQuad(null)

		this.#createRenderTargets_()
		this.#createPasses_()
	}

	get Settings() {
		return this.#settings_
	}

	#createRenderTarget_(name, scale, params) {
		this.#targets_[name] = {
			buffer: new THREE.WebGLRenderTarget(1, 1, params),
			params: params,
			scale: scale,
		}
	}

	#createRenderTargets_() {
		const bufferParams = {
			type: THREE.HalfFloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			generateMipmaps: false,
			depthBuffer: false,
			stencilBuffer: false,
		}

		// TODO: Make this better
		for (let i = 0; i <= this.#settings_.setup.levels; i++) {
			this.#createRenderTarget_('unity-downsample-' + i, 1.0 / 2 ** i, bufferParams)
			this.#createRenderTarget_('unity-upsample-' + i, 1.0 / 2 ** i, bufferParams)
		}
	}

	#createPasses_() {
		this.#createPass_('copy-texture', CopyShader)
		this.#createPass_('unity-downsample', DOWNSAMPLE_SHADER)
		this.#createPass_('unity-upsample', UPSAMPLE_SHADER)
		this.#createPass_('unity-composite', COMPOSITE_SHADER)
	}

	#createPass_(name, shaderData) {
		const material = new THREE.ShaderMaterial(shaderData)

		this.#passes_[name] = material
	}

	#renderPass_(name, renderer, targetBuffer) {
		this.#quad_.material = this.#passes_[name]
		renderer.setRenderTarget(targetBuffer)
		this.#quad_.render(renderer)
		renderer.setRenderTarget(null)
	}

	#buildColourMatrix_(contrast, brightness, saturation) {
		const IQ_ = new THREE.Quaternion()

		const bm = new THREE.Matrix4()
		if (brightness < 1.0) {
			bm.makeScale(brightness, brightness, brightness)
		} else {
			const lightness = brightness - 1.0
			bm.compose(
				new THREE.Vector3(lightness, lightness, lightness),
				IQ_,
				new THREE.Vector3(1, 1, 1)
			)
		}

		const c1 = contrast
		const c2 = (1 - c1) * 0.5
		const cm = new THREE.Matrix4().compose(
			new THREE.Vector3(c2, c2, c2),
			IQ_,
			new THREE.Vector3(c1, c1, c1)
		)

		const colourWeights = new THREE.Vector3(0.2126, 0.7152, 0.0722)
		const s = saturation
		const sm = new THREE.Matrix4(
			s + (1 - s) * colourWeights.x,
			(1 - s) * colourWeights.y,
			(1 - s) * colourWeights.z,
			0,
			(1 - s) * colourWeights.x,
			s + (1 - s) * colourWeights.y,
			(1 - s) * colourWeights.z,
			0,
			(1 - s) * colourWeights.x,
			(1 - s) * colourWeights.y,
			s + (1 - s) * colourWeights.z,
			0,
			0,
			0,
			0,
			1
		)

		const result = bm
		result.multiply(cm)
		result.multiply(sm)

		return result
	}

	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
		// this.threejs_.setRenderTarget(this.#targets_['diffuse'].buffer);
		// this.threejs_.render(this.scene_, this.camera_);
		// this.threejs_.setRenderTarget(null);

		this.#passes_['copy-texture'].uniforms.tDiffuse.value = readBuffer.texture
		this.#passes_['copy-texture'].needsUpdate = true
		this.#renderPass_('copy-texture', renderer, writeBuffer)

		// TODO: Extra copy is unnecessary
		this.#passes_['copy-texture'].uniforms.tDiffuse.value = readBuffer.texture
		this.#passes_['copy-texture'].needsUpdate = true
		this.#renderPass_('copy-texture', renderer, this.#targets_['unity-downsample-0'].buffer)

		// TODO: This is lazy
		for (let i = 0; i < this.#settings_.setup.levels; i++) {
			const srcName = 'unity-downsample-' + i
			const dstName = 'unity-downsample-' + (i + 1)
			if (!(dstName in this.#targets_)) {
				break
			}

			const src = this.#targets_[srcName].buffer
			const dst = this.#targets_[dstName].buffer

			this.#passes_['unity-downsample'].uniforms.frameTexture.value = src.texture
			this.#passes_['unity-downsample'].uniforms.useKaris.value = i == 0
			this.#passes_['unity-downsample'].uniforms.radius.value = this.#settings_.render.downRadius
			this.#passes_['unity-downsample'].uniforms.resolution.value = new THREE.Vector2(
				src.width,
				src.height
			)

			if (i == 0) {
				this.#passes_['unity-downsample'].uniforms.colourMatrix.value = this.#buildColourMatrix_(
					this.#settings_.render.contrast,
					this.#settings_.render.brightness,
					this.#settings_.render.saturation
				)
			} else {
				this.#passes_['unity-downsample'].uniforms.colourMatrix.value = new THREE.Matrix4()
			}

			this.#passes_['unity-downsample'].needsUpdate = true
			this.#renderPass_('unity-downsample', renderer, dst)
		}

		// Upsample
		// TODO: Stupid, be better
		const finalDownsample = 'unity-downsample-' + this.#settings_.setup.levels
		const finalUpsample = 'unity-upsample-' + this.#settings_.setup.levels
		this.#passes_['copy-texture'].uniforms.tDiffuse.value =
			this.#targets_[finalDownsample].buffer.texture
		this.#passes_['copy-texture'].needsUpdate = true
		this.#renderPass_('copy-texture', renderer, this.#targets_[finalUpsample].buffer)

		for (let i = this.#settings_.setup.levels; i >= 0; i--) {
			const srcName = 'unity-upsample-' + (i + 1)
			const dstName = 'unity-upsample-' + i
			if (!(srcName in this.#targets_)) {
				continue
			}

			const src = this.#targets_[srcName].buffer
			const srcMip = this.#targets_['unity-downsample-' + (i + 1)].buffer
			const dst = this.#targets_[dstName].buffer

			this.#passes_['unity-upsample'].uniforms.frameTexture.value = src.texture
			this.#passes_['unity-upsample'].uniforms.mipTexture.value = srcMip.texture
			this.#passes_['unity-upsample'].uniforms.radius.value = this.#settings_.render.upRadius
			this.#passes_['unity-upsample'].uniforms.resolution.value = new THREE.Vector2(
				src.width,
				src.height
			)
			this.#passes_['unity-upsample'].needsUpdate = true

			this.#renderPass_('unity-upsample', renderer, dst)
		}

		// this.#passes_['copy-texture'].uniforms.tDiffuse.value = this.#targets_['unity-upsample-0'].buffer.texture;
		// this.#passes_['copy-texture'].needsUpdate = true;
		// this.#renderPass_('copy-texture', renderer, writeBuffer);
		// this.needsSwap = true;

		this.#passes_['unity-composite'].uniforms.frameTexture.value = readBuffer.texture
		this.#passes_['unity-composite'].uniforms.bloomTexture.value =
			this.#targets_['unity-upsample-1'].buffer.texture
		this.#passes_['unity-composite'].uniforms.bloomStrength.value =
			this.#settings_.composite.strength
		this.#passes_['unity-composite'].uniforms.bloomMix.value = this.#settings_.composite.mixFactor
		this.#passes_['unity-composite'].needsUpdate = true
		this.#renderPass_('unity-composite', renderer, writeBuffer)

		this.needsSwap = true

		// this.#passes_['copy-texture'].uniforms.tDiffuse.value = this.#targets_['unity-upsample-1'].buffer.texture;
		// this.#passes_['copy-texture'].needsUpdate = true;
		// this.#renderPass_('copy-texture', renderer, writeBuffer);
		// this.needsSwap = true;
	}

	setSize(width, height) {
		for (let k in this.#targets_) {
			this.#targets_[k].buffer.setSize(
				Math.ceil(width * this.#targets_[k].scale),
				Math.ceil(height * this.#targets_[k].scale)
			)
		}

		for (let k in this.#passes_) {
			if (!this.#passes_[k].uniforms.resolution) {
				continue
			}
			this.#passes_[k].uniforms.resolution.value = new THREE.Vector2(width, height)
		}
	}

	dispose() {
		this.#quad_.dispose()
	}
}

export { BloomPass }
