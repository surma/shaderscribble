export default `#version 300 es
precision highp float;

in vec2 uv;
uniform float iTime;
uniform vec2 iResolution;
out vec4 color;

void main() {
  vec2 pixel = uv * iResolution;

  float isLine = clamp(
    step(99.0, mod(pixel.x, 100.0)) + step(99.0, mod(pixel.y, 100.0)),
  	0.0,
  	1.0
  );
  vec3 backgroundColor = mix(
    vec3(0.0, 0.0, 0.0),
    vec3(0.15, 0.15, 0.13),
    sin(iTime*3.0)*0.5 + 0.5
  );
  vec3 lineColor = vec3(1.0, 0.0, 0.0);
  color = vec4(
    mix(
      backgroundColor,
      lineColor,
      isLine
    ),
    1.0
  );
}`;
