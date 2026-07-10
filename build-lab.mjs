// Rebuilds lab.html from src/puzzle-lab.jsx.
// lab.html is GENERATED - never hand-edit it; edit the .jsx source, then:
//   npm install && npm run build:lab
//
// Reuses the React 18 + ReactDOM 18 UMD blocks already embedded in the current
// lab.html verbatim (so this script never needs network access to a CDN), and
// only recompiles the component script in between via Babel (JSX only - the
// source already targets evergreen browsers, same as the rest of the repo).
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import * as babel from "@babel/core";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src/puzzle-lab.jsx");
const OUT = path.join(ROOT, "lab.html");

const MARKER = '<div id="root"></div><script>';
const SUFFIX = "</script></body></html>";

const existing = readFileSync(OUT, "utf8");
const markerIdx = existing.indexOf(MARKER);
const suffixIdx = existing.indexOf(SUFFIX);
if (markerIdx === -1 || suffixIdx === -1) {
  throw new Error("lab.html doesn't match the expected shape (React/ReactDOM UMD prefix + component script). Aborting to avoid corrupting it.");
}
const prefix = existing.slice(0, markerIdx + MARKER.length); // <!doctype ... React UMD ... ReactDOM UMD ... <div id="root"></div><script>

let src = readFileSync(SRC, "utf8");
// the UMD bundle has no module system: swap the named import for a plain
// destructure off the global React (mirrors the previous build's output).
src = src
  .replace(/^import\s*\{([^}]+)\}\s*from\s*["']react["'];?\s*$/m, (_, names) => `const {${names}} = React;`)
  .replace(/^export default function/m, "function")
  .replace(/^export default\s+/m, "");

const { code } = babel.transformSync(src, {
  filename: "puzzle-lab.jsx",
  presets: [["@babel/preset-react", { runtime: "classic" }]],
  babelrc: false,
  configFile: false,
});

const mount = 'const root=ReactDOM.createRoot(document.getElementById("root"));root.render(React.createElement(SteamGazetteLab));';

writeFileSync(OUT, prefix + code + "\n" + mount + SUFFIX);
console.log("Rebuilt lab.html (" + (prefix.length + code.length + mount.length + SUFFIX.length) + " bytes)");
