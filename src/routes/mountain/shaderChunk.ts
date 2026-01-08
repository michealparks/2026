import { ShaderChunk } from 'three'
import noise from './noise.glsl?raw'

export const shaderChunk = () => {
	ShaderChunk.fog_vertex = `
	#ifdef USE_FOG
	  vWorldPosition = worldPosition.xyz;
	#endif
	`

	ShaderChunk.fog_pars_vertex = `
	#ifdef USE_FOG
	  varying vec3 vWorldPosition;
	  varying float vFogDepth;
	#endif
	`

	ShaderChunk.fog_pars_fragment = `
	#ifdef USE_FOG
	  #ifdef FOG_EXP2
	    uniform float fogDensity;

	    uniform float FOG_scatterDensity;
	    uniform float FOG_scatterHeightFalloff;
	    uniform float FOG_extinctionDensity;
	    uniform float FOG_extinctionHeightFalloff;
	    uniform float FOG_envMapIntensity;

	    varying float vFogDepth;
	    varying vec3 vWorldPosition;
	  #endif
	#endif

	float calculateFogFactor(
	    vec3 fogOrigin,
	    vec3 fogDirection,
	    float fogDepth,
	    float density,
	    float heightFalloff) {
	  float scatterFactor = fogDepth * exp(-fogOrigin.y * heightFalloff);
	  if (abs(fogDirection.y) > 0.0001) {
	    float t = heightFalloff * fogDirection.y;
	    scatterFactor = scatterFactor * (1.0 - exp(-t)) / t;
	  }
	  scatterFactor = 1.0 - exp(-scatterFactor * density);
	  scatterFactor = saturate(scatterFactor * scatterFactor);
	  return scatterFactor;
	}

	`

	ShaderChunk.fog_fragment = `
#ifdef USE_FOG

  vec3 fogOrigin = cameraPosition;
  vec3 fogDirection = vWorldPosition - cameraPosition;
  float fogDepth = length(fogDirection);

  float scatterFactor = calculateFogFactor(
      fogOrigin,
      fogDirection,
      fogDepth,
      FOG_scatterDensity,
      FOG_scatterHeightFalloff);

  float extinctionFactor = calculateFogFactor(
      fogOrigin,
      fogDirection,
      fogDepth,
      FOG_extinctionDensity,
      FOG_extinctionHeightFalloff);

  // Default fog color fallback (works for all materials)
  vec3 fogColor = vec3(1.0);

  // Only attempt env-map scattering when envmap chunks/uniforms exist.
  #ifdef USE_ENVMAP
    // Avoid geometryViewDir (not defined for all materials).
    // Use a world-space sample dir based on camera->fragment direction.
    vec3 fogSampleDir = normalize(fogDirection);

    // textureCubeUV + envMapRotation are also only guaranteed with USE_ENVMAP
    vec3 fogScatterColour = textureCubeUV(
        envMap, envMapRotation * fogSampleDir, 0.5
    ).xyz * FOG_envMapIntensity;

    fogColor = fogScatterColour;
  #endif

  gl_FragColor.rgb = (
      gl_FragColor.rgb * (1.0 - extinctionFactor) +
      fogColor * scatterFactor);

#endif
`

	ShaderChunk.noise = noise
}
