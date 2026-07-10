// Invariant checks (see the project rules in docs). Run: npm run check
// Enforces: zero em-dash (raw or escaped), no dagger/blade theme leakage,
// and no map preset whose answerCell sits on a structure (feature) tile.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CODE_EXT = new Set([".html", ".js", ".jsx", ".json", ".md"]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (CODE_EXT.has(path.extname(name))) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
let fail = 0;
const rel = (p) => path.relative(ROOT, p);

// 1. em-dash (U+2014 raw, or the — escape inside JS strings)
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  if (s.includes("—")) { console.log("EM-DASH (raw) in", rel(f)); fail++; }
  if (s.includes("\\u2014")) { console.log("EM-DASH (escaped) in", rel(f)); fail++; }
}

// 2. dagger / blade theme leakage. Scanned in shipped app files only; the docs
// under docs/ legitimately quote the banned words while explaining this rule.
const banned = [/\u{1F5E1}/u, /\bdagger\b/i, /\bblade\b/i, /ดาบ/];
for (const f of files) {
  if (rel(f).startsWith("docs" + path.sep) || rel(f).startsWith("docs/")) continue;
  const s = fs.readFileSync(f, "utf8");
  for (const re of banned) if (re.test(s)) { console.log("BANNED THEME token", re, "in", rel(f)); fail++; }
}

// 3. answer-on-feature
const maps = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/data/maps.json"), "utf8"));
for (const m of maps) {
  const a = m.answerCell;
  const cell = m.board.find((c) => c.col === a.col && c.row === a.row);
  if (!cell) { console.log("answerCell missing in", m.id); fail++; continue; }
  if (cell.features && cell.features.length) { console.log("ANSWER-ON-FEATURE in", m.id, cell.features); fail++; }
}

if (fail === 0) console.log(`check: OK (${files.length} files, ${maps.length} presets)`);
else console.log(`\ncheck: ${fail} violation(s)`);
process.exit(fail === 0 ? 0 : 1);
