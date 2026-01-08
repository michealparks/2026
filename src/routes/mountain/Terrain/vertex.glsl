uniform float TERRAIN_flatness;
uniform float TERRAIN_size;
uniform float TERRAIN_resolution;
uniform float TERRAIN_scale;
uniform int TERRAIN_octaves;
uniform float TERRAIN_persistence;
uniform float TERRAIN_lacunarity;
uniform float TERRAIN_height;
uniform float TERRAIN_seed;
uniform float TERRAIN_dropoff;

#include <noise>

vec3 TERRAIN_calculatePosition(vec3 position) {

  vec3 result = position;
  result.y = TERRAIN_height * FBM_1_3_TERRAIN(
      vec3(position.xz * TERRAIN_scale, TERRAIN_seed),
      TERRAIN_octaves,
      TERRAIN_persistence,
      TERRAIN_lacunarity,
      TERRAIN_flatness,
      TERRAIN_dropoff);

  // Flatten the edges
  float edgeValue = (
      smoothstep(TERRAIN_size - 18.0, TERRAIN_size - 20.0, abs(position.x)) *
      smoothstep(TERRAIN_size - 18.0, TERRAIN_size - 20.0, abs(position.z)));

  result.y *= edgeValue;

  float dropoff = (
      smoothstep(TERRAIN_size - 0.0, TERRAIN_size - 5.0, abs(position.x)) *
      smoothstep(TERRAIN_size - 0.0, TERRAIN_size - 5.0, abs(position.z)));

  result.y -= (1.0 - dropoff) * 25.0;

  return result;

}

void TERRAIN_transform(inout vec3 pos, inout vec3 normal) {

  vec2 eps = vec2(TERRAIN_size / TERRAIN_resolution, 0.0);
  vec3 dx = TERRAIN_calculatePosition(pos + eps.xyy) - TERRAIN_calculatePosition(pos - eps.xyy);
  vec3 dz = TERRAIN_calculatePosition(pos + eps.yyx) - TERRAIN_calculatePosition(pos - eps.yyx);

  dx = normalize(dx);
  dz = normalize(dz);

  normal = normalize(cross(dz, dx));
  pos = TERRAIN_calculatePosition(pos);
}
