
// Virtually all of these were taken from: https://www.shadertoy.com/view/ttc3zr

//------------------------------------------------------------------------------

uint murmurHash12(uvec2 src) {
    const uint M = 0x5bd1e995u;
    uint h = 1190494759u;
    src *= M; src ^= src>>24u; src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

// 1 output, 2 inputs
float hash12(vec2 src) {
    uint h = murmurHash12(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

uint murmurHash13(uvec3 src) {
  const uint M = 0x5bd1e995u;
  uint h = 1190494759u;
  src *= M; src ^= src>>24u; src *= M;
  h *= M; h ^= src.x; h *= M; h ^= src.y; h *= M; h ^= src.z;
  h ^= h>>13u; h *= M; h ^= h>>15u;
  return h;
}

// 1 output, 3 inputs
float hash13(vec3 src) {
  uint h = murmurHash13(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}


float noise12(vec2 p) {
  vec2 i = floor(p);

  vec2 f = fract(p);
  vec2 u = smoothstep(vec2(0.0), vec2(1.0), f);

	float val = mix( mix( hash12( i + vec2(0.0, 0.0) ), 
                        hash12( i + vec2(1.0, 0.0) ), u.x),
                   mix( hash12( i + vec2(0.0, 1.0) ), 
                        hash12( i + vec2(1.0, 1.0) ), u.x), u.y);
  return val * 2.0 - 1.0;
}

float noise13(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);

  float val = mix(mix(mix( hash13(i+vec3(0.0, 0.0, 0.0)), 
                           hash13(i+vec3(1.0, 0.0, 0.0)),f.x),
                      mix( hash13(i+vec3(0.0, 1.0, 0.0)), 
                           hash13(i+vec3(1.0, 1.0, 0.0)),f.x),f.y),
                  mix(mix( hash13(i+vec3(0.0, 0.0, 1.0)), 
                           hash13(i+vec3(1.0, 0.0, 1.0)),f.x),
                      mix( hash13(i+vec3(0.0, 1.0, 1.0)), 
                           hash13(i+vec3(1.0, 1.0, 1.0)),f.x),f.y),f.z);
  return val * 2.0 - 1.0;
}

// https://iquilezles.org/articles/morenoise/
float hash1( float n )
{
  return fract( n*17.0*fract( n*0.3183099 ) );
}

vec4 noised( in vec3 x )
{
  vec3 p = floor(x);
  vec3 w = fract(x);
  #if 1
  vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);
  vec3 du = 30.0*w*w*(w*(w-2.0)+1.0);
  #else
  vec3 u = w*w*(3.0-2.0*w);
  vec3 du = 6.0*w*(1.0-w);
  #endif

  float n = p.x + 317.0*p.y + 157.0*p.z;
  
  float a = hash1(n+0.0);
  float b = hash1(n+1.0);
  float c = hash1(n+317.0);
  float d = hash1(n+318.0);
  float e = hash1(n+157.0);
	float f = hash1(n+158.0);
  float g = hash1(n+474.0);
  float h = hash1(n+475.0);

  float k0 =   a;
  float k1 =   b - a;
  float k2 =   c - a;
  float k3 =   e - a;
  float k4 =   a - b - c + d;
  float k5 =   a - c - e + g;
  float k6 =   a - b - e + f;
  float k7 = - a + b + c - d + e - f - g + h;

  return vec4( -1.0 + 2.0 * (k0 + k1*u.x + k2*u.y + k3*u.z + k4*u.x*u.y + k5*u.y*u.z + k6*u.z*u.x + k7*u.x*u.y*u.z), 
                    2.0* du * vec3( k1 + k4*u.y + k6*u.z + k7*u.y*u.z,
                                    k2 + k5*u.z + k4*u.x + k7*u.z*u.x,
                                    k3 + k6*u.x + k5*u.y + k7*u.x*u.y ) );
}

float FBM_1_2(
    vec2 p, int octaves, float persistence, float lacunarity, float exponentiation) {
  float amplitude = 1.0;
  float frequency = 1.0;
  float total = 0.0;
  float normalization = 0.0;

  for (int i = 0; i < octaves; ++i) {
    float noiseValue = noise12(p);

    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= persistence;
    p = p * lacunarity;
  }

  total /= normalization;
  total = pow(total * 0.5 + 0.5, exponentiation);
  
  return total;
}

float FBM_1_3_TERRAIN(
    vec3 p, int octaves, float persistence,
    float lacunarity, float exponentiation, float dropoff) {
  float amplitude = 1.0;
  float frequency = 1.0;
  float total = 0.0;
  float normalization = 0.0;
  vec3 gradient = vec3(0.0);

  for (int i = 0; i < octaves; ++i) {
    vec4 noiseSample = noised(p);
    float noiseValue = noiseSample.x;
    vec3 gradientSample = noiseSample.yzw;
    gradient += gradientSample * amplitude;

    if (i < 2) {
      float dropoffFactor = 1.0 / (1.0 + dot(gradient, gradient));
      total += noiseValue * amplitude * mix(1.0, dropoffFactor, dropoff);
    } else {
      total += noiseValue * amplitude;
    }

    normalization += amplitude;
    amplitude *= persistence;
    p = p * lacunarity;
  }

  total /= normalization;
  total = pow(total * 0.5 + 0.5, exponentiation);
  
  return total;
}

float FBM_1_3(
    vec3 p, int octaves, float persistence, float lacunarity, float exponentiation) {
  float amplitude = 1.0;
  float frequency = 1.0;
  float total = 0.0;
  float normalization = 0.0;

  for (int i = 0; i < octaves; ++i) {
    float noiseValue = noise13(p);

    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= persistence;
    p = p * lacunarity;
  }

  total /= normalization;
  total = pow(total * 0.5 + 0.5, exponentiation);
  
  return total;
}