
varying vec2 vUv;
uniform sampler2D depthTexture;

#include <packing>

void main() {
  float depth = texture(depthTexture, vUv).r;

  gl_FragColor = packDepthToRGBA(depth);
}
