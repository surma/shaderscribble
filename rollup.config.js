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

import { terser } from "rollup-plugin-terser";
import loadz0r from "rollup-plugin-loadz0r";
import nodeResolve from "rollup-plugin-node-resolve";
import inline from "rollup-plugin-inline-js";
import url from "rollup-plugin-url";
import hashManifest from "./rollup-plugin-hash-manifest.js";

require("rimraf").sync("dist");
require("rimraf").sync("*.hashmanifest.json");

export default {
  input: ["src/main.js"],
  output: {
    dir: "dist",
    format: "amd",
    entryFileNames: "[name]-[hash].js",
    chunkFileNames: "[name]-[hash].js",
    sourcemap: true
  },
  experimentalCodeSplitting: true,
  plugins: [
    url({
      limit: 1,
      include: ["**/*.css"]
    }),
    nodeResolve(),
    inline(),
    loadz0r(),
    terser(),
    hashManifest()
  ]
};
