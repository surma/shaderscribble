export default `#version 300 es
precision highp float;

in vec2 pos;
out vec2 uv;

void main() {
  gl_Position = vec4(pos, 0.0, 1.0);
  uv = pos / 2.0 + 0.5;
}`;
