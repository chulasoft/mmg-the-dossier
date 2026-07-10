// jsdom smoke tests: every page boots, shared FX + anime load, the host runs a
// full round in its SVG fallback path. Run: npm run smoke  (needs devDep jsdom)
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const maps = read("assets/data/maps.json");
const i18n = read("assets/js/i18n.js");
const anime = read("assets/vendor/anime.min.js");
const fx = read("assets/js/fx.js");

const inlineShared = (html) => html
  .replace('<script src="./assets/js/i18n.js"></script>', "<script>" + i18n + "</script>")
  .replace('<script src="./assets/vendor/anime.min.js"></script>', "<script>" + anime + "</script>")
  .replace('<script src="./assets/js/fx.js"></script>', "<script>" + fx + "</script>");
const stripESM = (html) => html
  .replace(/<script type="importmap">[\s\S]*?<\/script>/gi, "")
  .replace(/<script type="module">[\s\S]*?<\/script>/gi, "");

const results = [];
const step = (name, ok) => results.push([name, !!ok]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function makeDom(file, url, { esm = false, reduce = false } = {}) {
  let html = inlineShared(read(file));
  if (esm) html = stripESM(html);
  const errors = [];
  const dom = new JSDOM(html, {
    url, runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
    beforeParse(w) {
      w.fetch = (u) => String(u).includes("maps.json")
        ? Promise.resolve({ json: () => Promise.resolve(JSON.parse(maps)) })
        : Promise.reject(new Error("unstubbed " + u));
      w.addEventListener("error", (e) => errors.push(e.message || String(e.error)));
      w.matchMedia = (q) => ({ matches: reduce, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      if (esm) w.HTMLCanvasElement.prototype.getContext = () => null; // force SVG fallback
    },
  });
  return { dom, errors };
}

// index
{
  const { dom, errors } = makeDom("index.html", "https://x/index.html");
  await wait(800);
  const d = dom.window.document;
  step("index title", d.querySelector(".title")?.textContent.length > 0);
  step("index choices x2", d.querySelectorAll(".choice").length === 2);
  step("index FX", typeof dom.window.FX === "object");
  step("index anime", typeof dom.window.anime === "function");
  step("index no errors", errors.length === 0);
  dom.window.close();
}

// companion
{
  const { dom, errors } = makeDom("companion.html", "https://x/companion.html?map=0&p=0&mode=open");
  await wait(900);
  const d = dom.window.document;
  step("companion app shown", !d.getElementById("app").classList.contains("hidden"));
  step("companion crest", d.getElementById("crestName")?.textContent.length > 0);
  step("companion intel", d.getElementById("intelText")?.textContent.length > 0);
  step("companion board svg", !!d.querySelector("#mapWrap svg"));
  step("companion no errors", errors.length === 0);
  dom.window.close();
}

// host full flow (SVG fallback, reduced motion so anime resolves instantly)
{
  const { dom, errors } = makeDom("host.html", "https://x/host.html", { esm: true, reduce: true });
  const w = dom.window, d = w.document;
  const click = (el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await wait(700);
  step("host FX", typeof w.FX === "object");
  step("host societies i18n", d.querySelector("#selNums .sel-num span")?.textContent === "societies");
  click([...d.querySelectorAll("#selNums .sel-num")].find((e) => e.querySelector("b").textContent === "3"));
  await wait(300);
  step("host briefing", d.getElementById("brief").classList.contains("active"));
  click(d.getElementById("briefGo"));
  await wait(800);
  step("host qr", d.getElementById("qr").classList.contains("active"));
  step("host qr box", !!d.getElementById("qrBox").innerHTML);
  let guard = 0;
  while (d.getElementById("qrNext") && guard++ < 8) {
    const t = d.getElementById("qrNext").textContent;
    const last = t.includes("Begin the hunt") || t.includes("ออกล่า");
    click(d.getElementById("qrNext"));
    await wait(120);
    if (last) break;
  }
  await wait(900);
  step("host board", d.getElementById("game").classList.contains("active"));
  step("host topbar x3", d.querySelectorAll("#tbPlayers .tb-pl").length === 3);
  const inv = d.getElementById("btnInvestigate");
  if (inv) { click(inv); await wait(200); }
  step("host no errors through flow", errors.length === 0);
  if (errors.length) console.log("  host errors:", errors.slice(0, 4));
  dom.window.close();
}

console.log("\n=== SMOKE ===");
let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} passed`);
process.exit(pass === results.length ? 0 : 1);
