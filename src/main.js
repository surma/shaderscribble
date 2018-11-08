/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {setShader} from "./gl.js";
import vertexShader from "./templates/vertexshader.js";
import HelpText from "./templates/help.js";
import CodeMirror from "codemirror/src/codemirror.js";
window.CodeMirror = CodeMirror;

let idbset, idbget;
let storageKey = "scratchpad";
const canvas = document.querySelector("canvas");
let gl;
let program;
let iGlobalTimeUniform;
let iResolutionUniform;
let dirty = false;
let hasBeenEdited = false;
let lastVertexShader = null;

function updateShaders() {
  if (!dirty) {
    return;
  }
  const content = editor.getValue();
  if (idbset) {
    idbset(storageKey, content);
  }

  setShader(gl, program, gl.VERTEX_SHADER, vertexShader);
  if (lastVertexShader) {
    gl.detachShader(program, lastVertexShader);
  }
  lastVertexShader = setShader(gl, program, gl.FRAGMENT_SHADER, content);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Couldn’t link program: ${gl.getProgramInfoLog(program)}`);
  }
  gl.validateProgram(program);
  if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    throw new Error(`Couldn’t validate program: ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);
  iGlobalTimeUniform = gl.getUniformLocation(program, 'iTime');
  iResolutionUniform = gl.getUniformLocation(program, 'iResolution');
  gl.uniform2f(iResolutionUniform, canvas.width, canvas.height);
  dirty = false;
}

function hasFlag(flag) {
  return (new RegExp(`(?:^#|,)(${flag}(?:=[^,]+)?)(?:,|$)`).exec(location.hash) || [])[1];
}

function loadCSS(file) {
  return new Promise(resolve => {
    const link = document.createElement("link");
    link.href = file;
    link.rel = "stylesheet";
    link.onload = resolve;
    document.head.append(link);
  });
}

function setupCanvas(editor) {
  const size = canvas.getBoundingClientRect();
  [canvas.width, canvas.height] = [size.width, size.height];
  if (hasFlag("realpixels")) {
    canvas.width *= devicePixelRatio;
    canvas.height *= devicePixelRatio;
  }
  gl = canvas.getContext('webgl2', {antialias: false});
  gl.viewport(0, 0, canvas.width, canvas.height);
  program = gl.createProgram();
  updateShaders();

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, 1,
    -1, -1,
    1, 1,

    1, 1,
    -1, -1,
    1, -1,
  ]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  iGlobalTimeUniform = gl.getUniformLocation(program, 'iTime');
  iResolutionUniform = gl.getUniformLocation(program, 'iResolution');
  const startTime = performance.now();
  gl.uniform2f(iResolutionUniform, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);

  if(!hasFlag("norun")) {
    setInterval(updateShaders, 1000);
    requestAnimationFrame(function loop(ts) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(iGlobalTimeUniform, (ts - startTime)/1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(loop);
    });
  }
}

async function init() {
  if (hasFlag("flip")) {
    document.body.style.flexDirection = "column-reverse";
  }
  let name = hasFlag("name");
  if(name) {
    storageKey = `scratchpad_${name.split("=")[1]}`;
  }
  const ta = document.querySelector("#editor")
  ta.value = HelpText;
  window.editor = CodeMirror.fromTextArea(ta, {
    lineNumbers: true,
    matchBrackets: true,
    styleActiveLine: true,
    theme: "monokai"
  });
  editor.on("change", () => (hasBeenEdited = dirty = true));
  setupCanvas(editor);

  // Lazy CSS
  import("../static/third_party/monokai.css").then(m =>loadCSS(m.default));

  ({ get: idbget, set: idbset } = await import("idb-keyval"));
  if (hasFlag("help")) {
    editor.setValue(HelpText);
  } else if (hasFlag("boilerplate")) {
    editor.setValue((await import("./templates/boilerplate.js")).default);
  } else if (!hasBeenEdited) {
    const content = await idbget(storageKey);
    if (content) {
      editor.setValue(content);
    }
  }

  const { modeInjector } = await import("./mode-injector.js");
  modeInjector(CodeMirror);
  editor.setOption("mode", "clike");

  navigator.serviceWorker.register("sw.js");
}
init();
