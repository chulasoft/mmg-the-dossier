import { useState, useMemo, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
//  THE DOSSIER : PUZZLE LAB
//  13×10 · Fairness + Difficulty (ง่าย/ยาก) · grouped library
// ═══════════════════════════════════════════════════════════════

const COLS = 13, ROWS = 10, HS = 26;
const TOTAL = COLS * ROWS;

const TERRAIN = {
  factory:  { fill: "#6b4a2e", label: "ย่านโรงงาน",   icon: "🏭" },             // น้ำตาลเข้ม
  smog:     { fill: "#cdd2d6", label: "ตรอกหมอกควัน", icon: "🌫️" },             // เทาอ่อน
  cemetery: { fill: "#a8d8a8", label: "สุสานเก่า",    icon: "✝" },              // เขียวอ่อน
  slums:    { fill: "#e8b4c4", label: "สลัมร้าง",     icon: "🏚" },             // ชมพูอ่อน
  harbor:   { fill: "#2a4a78", label: "ท่าเรือ",      icon: "🌊", water: true }, // น้ำเงินเข้ม
};
const TERRAINS = Object.keys(TERRAIN);

const FEATURE = {
  clock_tower: { icon: "🕰", label: "หอนาฬิกา",  min: 1, max: 2, onRail: false, noWater: true },
  station:     { icon: "🚉", label: "สถานีรถไฟ", min: 1, max: 3, onRail: true,  noWater: true },
  power_plant: { icon: "⚡", label: "โรงไฟฟ้า",   min: 3, max: 4, onRail: false, noWater: true },
};

// faction = distinct clue category. sources list = ใช้ใน codex + legend mapping
const FACTION = {
  cogwork: {
    th: "สมาคมเฟืองจักร", icon: "⚙", color: "#8a6a28", intel: "สายลับในโรงงาน",
    theme: "วัดระยะจากหัวใจอุตสาหกรรม",
    flavor: "สายลับที่ฝังตัวในสายพานการผลิต รู้จักทุกปล่องควันและรางเหล็ก แม้แต่หมอกควันที่ลอยจากโรงงานก็เป็นเข็มทิศของพวกเขา",
    sources: [["🏭", "ย่านโรงงาน"], ["⚡", "โรงไฟฟ้า"], ["🛤", "รางรถไฟ"], ["🌫️", "หมอกควัน"]],
  },
  seance: {
    th: "คณะทรงญาณ", icon: "☽", color: "#6a4a7a", intel: "ญาณจาก Seer",
    theme: "วัดระยะจากแหล่งลางสังหรณ์",
    flavor: "ผู้หยั่งรู้ที่สัมผัสความตาย ความเสื่อมโทรม และกาลเวลา ญาณของพวกเขาสั่นไหวใกล้สุสาน สลัม และเสียงเข็มนาฬิกา",
    sources: [["🕰", "หอนาฬิกา"], ["✝", "สุสานเก่า"], ["🏚", "สลัมร้าง"], ["🌫️", "หมอกควัน"]],
  },
  ashen: {
    th: "กลุ่มเถ้าธุลี", icon: "✦", color: "#9a3a2a", intel: "การสอบสวนทรมาน",
    theme: "ระบุภูมิประเทศที่ปีศาจหลบซ่อน",
    flavor: "เครือข่ายสอบสวนทรมานพวกปีศาจแฝงตัวเพื่อระบุตำแหน่งภูมิประเทศแบบใดเป็นของหัวหน้าพวกมัน",
    sources: [["🗺️", "ภูมิประเทศทุกชนิด (อยู่ใน / หรือ)"]],
  },
  lamplight: {
    th: "คณะตะเกียง", icon: "🕯", color: "#a07028", intel: "เครือข่ายนักข่าว",
    theme: "วัดระยะจากสิ่งปลูกสร้างใดๆ",
    flavor: "เครือข่ายนักข่าวและประชาชนที่จับตาทุก landmark ของเมือง เบาะแสของพวกเขาจะอยู่ใกล้กับสิ่งปลูกสร้างต่างๆ",
    sources: [["🕰", "หอนาฬิกา"], ["🚉", "สถานีรถไฟ"], ["⚡", "โรงไฟฟ้า"], ["·", "แบบ 'ใดๆ' (OR)"]],
  },
  crown: {
    th: "มงกุฎเหล็ก", icon: "♛", color: "#3a5a72", intel: "ข่าวกรองรัฐ",
    theme: "วัดระยะจากเส้นทางคมนาคมรัฐ",
    flavor: "ข่าวกรองรัฐที่ควบคุมเครือข่ายขนส่ง รางรถไฟ ท่าเรือ สถานี และหอนาฬิกากลางเมืองคือสายตาของพวกเขา",
    sources: [["🛤", "รางรถไฟ"], ["🌊", "ท่าเรือ"], ["🕰", "หอนาฬิกา"], ["🚉", "สถานีรถไฟ"]],
  },
};
const FACTIONS = Object.keys(FACTION);

// prefix รหัส index ของแต่ละ faction
const FAC_CODE = { cogwork: "CW", seance: "SE", ashen: "AS", lamplight: "LA", crown: "CR" };

const TIERS = {
  easy: { th: "ง่าย", c: "#4a7c3a" },
  hard: { th: "ยาก", c: "#9a2a1e" },
};
// ผลเฉลี่ยทั้งเกม (avg support fraction): ตรงเป้า / พอเป็นไปได้ / กำกวม
const RESULT = {
  sharp:  { th: "ตรงเป้า",      c: "#4a7c3a" },
  loose:  { th: "พอเป็นไปได้", c: "#9a7a2a" },
  vague:  { th: "กำกวม",        c: "#9a2a1e" },
};
const resultOfAvg = (avgPct) => avgPct < 0.18 ? "sharp" : avgPct < 0.32 ? "loose" : "vague";

// ── hex math ─────────────────────────────────────────────────
const hpos = (c, r) => ({ x: HS * 1.75 * c + (r % 2 ? HS * 0.875 : 0) + HS, y: HS * 1.52 * r + HS });
const hpts = (cx, cy, rr) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 180) * (60 * i - 30); return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`; }).join(" ");
const toCube = (c, r) => { const x = c - (r - (r & 1)) / 2; return { x, y: -x - r, z: r }; };
const hdist = (a, b) => { const A = toCube(a.col, a.row), B = toCube(b.col, b.row); return Math.max(Math.abs(A.x - B.x), Math.abs(A.y - B.y), Math.abs(A.z - B.z)); };
function neighbors(c, r) {
  const odd = r & 1;
  const d = odd ? [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]] : [[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]];
  return d.map(([dc, dr]) => ({ col: c + dc, row: r + dr })).filter(n => n.col >= 0 && n.col < COLS && n.row >= 0 && n.row < ROWS);
}
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// ── board ────────────────────────────────────────────────────
function makeBoard() {
  const seeds = TERRAINS.map(t => ({ t, col: rnd(0, COLS - 1), row: rnd(0, ROWS - 1) }));
  const cells = [], grid = {};
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    let minD = Infinity, terrain = "slums";
    for (const s of seeds) { const d = Math.abs(s.col - c) + Math.abs(s.row - r) + Math.random() * 2.8; if (d < minD) { minD = d; terrain = s.t; } }
    const cell = { col: c, row: r, terrain, features: [], rail: false, id: `${c}-${r}` };
    cells.push(cell); grid[cell.id] = cell;
  }
  let rc = 0, rr = rnd(0, ROWS - 1), guard = 0;
  grid[`${rc}-${rr}`].rail = true;
  while (rc < COLS - 1 && guard++ < 110) {
    const opts = neighbors(rc, rr).filter(n => n.col >= rc);
    if (!opts.length) break;
    opts.sort((a, b) => (b.col - a.col) - (a.col - b.col) + (Math.random() - 0.5));
    const nx = opts[Math.floor(Math.random() * Math.min(2, opts.length))];
    rc = nx.col; rr = nx.row; grid[`${rc}-${rr}`].rail = true;
  }
  const place = (feat) => {
    const fd = FEATURE[feat], count = rnd(fd.min, fd.max);
    let pool = cells.filter(c => c.features.length === 0 && (!fd.noWater || !TERRAIN[c.terrain].water) && (!fd.onRail || c.rail)).sort(() => Math.random() - 0.5);
    let n = 0; for (const c of pool) { if (n >= count) break; c.features.push(feat); n++; }
  };
  place("station"); place("clock_tower"); place("power_plant");
  return cells;
}

// ── clue pool (positive only · ตาม source ของแต่ละ faction) ──
function buildCluePool() {
  const P = [];
  const wf = (f, feat, d, l, tk) => P.push({ faction: f, type: "within_feat", feat, dist: d, label: l, tplKey: tk });
  const wfor = (f, feats, d, l, tk) => P.push({ faction: f, type: "within_feat_or", feats, dist: d, label: l, tplKey: tk });
  const wr = (f, d, l, tk) => P.push({ faction: f, type: "within_rail", dist: d, label: l, tplKey: tk });
  const wt = (f, t, d, l, tk) => P.push({ faction: f, type: "within_terrain", terrain: t, dist: d, label: l, tplKey: tk });
  const ot = (f, t, l, tk) => P.push({ faction: f, type: "on_terrain", terrain: t, label: l, tplKey: tk });
  const otor = (f, ts, l, tk) => P.push({ faction: f, type: "on_terrain_or", terrains: ts, label: l, tplKey: tk });

  // COGWORK: 🏭โรงงาน · ⚡โรงไฟฟ้า · 🛤ราง · 🌫️หมอก  (วัดระยะ)
  for (const d of [3, 2, 1]) wf("cogwork", "power_plant", d, `ภายใน ${d} ช่องจากโรงไฟฟ้า ⚡`, "cw_power");
  for (const d of [2, 1]) wt("cogwork", "factory", d, `ภายใน ${d} ช่องจากย่านโรงงาน 🏭`, "cw_factory");
  for (const d of [2, 1]) wr("cogwork", d, `ภายใน ${d} ช่องจากรางรถไฟ 🛤`, "cw_rail");
  for (const d of [2, 1]) wt("cogwork", "smog", d, `ตามควันโรงงาน ภายใน ${d} ช่องจากตรอกหมอกควัน 🌫️`, "cw_smog");

  // SEANCE: 🕰หอนาฬิกา · ✝สุสาน · 🏚สลัม · 🌫️หมอก  (วัดระยะ)
  for (const d of [3, 2, 1]) wf("seance", "clock_tower", d, `เข็มเวลาแผ่ถึง ภายใน ${d} ช่องจากหอนาฬิกา 🕰`, "se_clock");
  for (const d of [2, 1]) wt("seance", "cemetery", d, `กลิ่นความตาย ภายใน ${d} ช่องจากสุสาน ✝`, "se_cemetery");
  for (const d of [2, 1]) wt("seance", "slums", d, `เสียงครวญคราง ภายใน ${d} ช่องจากสลัมร้าง 🏚`, "se_slums");
  for (const d of [2, 1]) wt("seance", "smog", d, `เงาในหมอก ภายใน ${d} ช่องจากตรอกหมอกควัน 🌫️`, "se_smog");

  // ASHEN: ภูมิประเทศ (อยู่ใน / หรือ)
  for (const t of TERRAINS) ot("ashen", t, `คำสารภาพชี้ว่าซ่อนใน${TERRAIN[t].label} ${TERRAIN[t].icon}`, "as_terrain");
  const pairs = [["factory", "smog"], ["factory", "slums"], ["cemetery", "harbor"], ["smog", "slums"], ["slums", "harbor"], ["factory", "cemetery"], ["cemetery", "slums"]];
  for (const [a, b] of pairs) otor("ashen", [a, b], `ซ่อนใน${TERRAIN[a].label}หรือ${TERRAIN[b].label}`, "as_pair");
  const triples = [["factory", "smog", "slums"], ["cemetery", "harbor", "slums"], ["factory", "cemetery", "smog"]];
  for (const [a, b, c] of triples) otor("ashen", [a, b, c], `ซ่อนใน${TERRAIN[a].label}/${TERRAIN[b].label}/${TERRAIN[c].label}`, "as_triple");

  // LAMPLIGHT: ระยะจาก "สิ่งปลูกสร้างใดๆ" (OR)
  const allStruct = ["clock_tower", "station", "power_plant"];
  for (const d of [2, 1]) wfor("lamplight", allStruct, d, `เครือข่ายข่าว ภายใน ${d} ช่องจากสิ่งปลูกสร้างใดๆ 🕰🚉⚡`, "la_allstruct");
  for (const d of [2, 1]) wfor("lamplight", ["clock_tower", "station"], d, `แหล่งข่าวใจกลางเมือง ภายใน ${d} ช่องจากหอนาฬิกาหรือสถานี 🕰🚉`, "la_downtown");
  for (const d of [2, 1]) wfor("lamplight", ["station", "power_plant"], d, `สายข่าวอุตสาหกรรม ภายใน ${d} ช่องจากสถานีหรือโรงไฟฟ้า 🚉⚡`, "la_industrial");
  for (const d of [1]) wfor("lamplight", ["clock_tower", "power_plant"], d, `เบาะแสคู่ ภายใน ${d} ช่องจากหอนาฬิกาหรือโรงไฟฟ้า 🕰⚡`, "la_paired");

  // CROWN: 🛤ราง · 🌊ท่าเรือ · 🕰หอนาฬิกา · 🚉สถานี  (วัดระยะ)
  P.push({ faction: "crown", type: "on_rail", label: `จารกรรมรัฐ อยู่บนรางรถไฟ 🛤`, tplKey: "cr_espionage" });
  for (const d of [3, 2, 1]) wr("crown", d, `เครือข่ายราง ภายใน ${d} ช่องจากรางรถไฟ 🛤`, "cr_railnet");
  for (const d of [2, 1]) wt("crown", "harbor", d, `แฟ้มท่าเรือ ภายใน ${d} ช่องจากท่าเรือ 🌊`, "cr_harbor");
  for (const d of [2, 1]) wf("crown", "clock_tower", d, `หอสังเกตการณ์ ภายใน ${d} ช่องจากหอนาฬิกา 🕰`, "cr_watchtower");
  for (const d of [2, 1]) wf("crown", "station", d, `บันทึกขบวนรถ ภายใน ${d} ช่องจากสถานีรถไฟ 🚉`, "cr_trainlog");

  // tag tier (ตอนนี้ทำแต่ "ง่าย" ก่อน) + รหัส index ต่อ faction
  const counters = {};
  for (const clue of P) {
    if (!clue.tier) clue.tier = "easy";
    counters[clue.faction] = (counters[clue.faction] || 0) + 1;
    clue.code = `${FAC_CODE[clue.faction]}-${String(counters[clue.faction]).padStart(2, "0")}`;
  }
  return P;
}
const CLUE_POOL = buildCluePool();

function evalClue(clue, cell, cells) {
  switch (clue.type) {
    case "within_feat": { const ts = cells.filter(c => c.features.includes(clue.feat)); return ts.length > 0 && ts.some(t => hdist(cell, t) <= clue.dist); }
    case "within_feat_or": { const ts = cells.filter(c => c.features.some(f => clue.feats.includes(f))); return ts.length > 0 && ts.some(t => hdist(cell, t) <= clue.dist); }
    case "within_terrain": { if (cell.terrain === clue.terrain) return true; const ts = cells.filter(c => c.terrain === clue.terrain); return ts.some(t => hdist(cell, t) <= clue.dist); }
    case "on_terrain": return cell.terrain === clue.terrain;
    case "on_terrain_or": return clue.terrains.includes(cell.terrain);
    case "on_rail": return cell.rail;
    case "within_rail": { const ts = cells.filter(c => c.rail); return ts.some(t => hdist(cell, t) <= clue.dist); }
    default: return false;
  }
}
const supportOf = (clue, cells) => cells.filter(c => evalClue(clue, c, cells)).length;

// ── generator: filter clues by tier tag, prioritize fairness ─
function genPuzzle(cells, playerCount, clueTier) {
  const total = cells.length;
  // ปีศาจไม่อยู่บนช่องที่มีสิ่งก่อสร้าง (มิเนเจอ) เลย เลือกคำตอบจากช่องว่างเท่านั้น
  const candidates = cells.filter(c => c.features.length === 0);
  const answer = candidates[Math.floor(Math.random() * candidates.length)];
  const byFaction = {}; FACTIONS.forEach(f => byFaction[f] = []);
  for (const clue of CLUE_POOL) {
    if (clueTier && clueTier !== "any" && clue.tier !== clueTier) continue; // tier เป็น tag ของ clue
    if (!evalClue(clue, answer, cells)) continue;
    const sup = supportOf(clue, cells);
    if (sup < 2 || sup >= total) continue;
    byFaction[clue.faction].push({ ...clue, support: sup });
  }
  const usable = FACTIONS.filter(f => byFaction[f].length > 0);
  if (usable.length < playerCount) return null;

  let best = null, bestScore = -Infinity;
  for (let a = 0; a < 900; a++) {
    const facs = [...usable].sort(() => Math.random() - 0.5).slice(0, playerCount);
    const chosen = facs.map(f => byFaction[f][Math.floor(Math.random() * byFaction[f].length)]);
    const inter = cells.filter(c => chosen.every(cl => evalClue(cl, c, cells)));
    if (inter.length !== 1 || inter[0].id !== answer.id) continue;

    const sups = chosen.map(c => c.support);
    const spread = (Math.max(...sups) - Math.min(...sups)) / total;
    const fairness = 1 - spread;
    const contrib = chosen.map((_, i) => {
      const rest = chosen.filter((_, j) => j !== i);
      return cells.filter(c => rest.every(cl => evalClue(cl, c, cells))).length - 1;
    });
    const allContrib = contrib.every(c => c > 0);
    const score = fairness * 0.7 + (allContrib ? 0.3 : 0);

    if (score > bestScore) { bestScore = score; best = { chosen, contrib, fairness }; }
  }
  if (!best) return null;

  const sups = best.chosen.map(c => c.support);
  const avgPct = sups.reduce((x, y) => x + y, 0) / sups.length / total;
  const result = resultOfAvg(avgPct);              // ตรงเป้า/พอเป็นไปได้/กำกวม
  const tiersUsed = [...new Set(best.chosen.map(c => c.tier))];
  const clueTierLabel = tiersUsed.length === 1 ? tiersUsed[0] : "mixed";

  return {
    answer,
    clues: best.chosen.map((c, i) => ({ ...c, contribution: best.contrib[i] })),
    fairness: best.fairness, avgPct, result, clueTier: clueTierLabel, allContrib: best.chosen.every((_, i) => best.contrib[i] > 0),
  };
}

// ── typewriter ───────────────────────────────────────────────
function useTypewriter(text, speed = 22) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut(""); if (!text) return;
    let i = 0; const id = setInterval(() => { i++; setOut(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

// ── board svg ────────────────────────────────────────────────
function HexBoard({ cells, answer, hoverClue, showAnswer }) {
  const [hov, setHov] = useState(null);
  const hlSet = useMemo(() => hoverClue ? new Set(cells.filter(c => evalClue(hoverClue, c, cells)).map(c => c.id)) : new Set(), [hoverClue, cells]);
  const railCells = useMemo(() => cells.filter(c => c.rail), [cells]);
  const svgW = HS * 1.75 * COLS + HS * 2, svgH = HS * 1.52 * ROWS + HS * 2;
  const segs = [];
  for (const a of railCells) for (const b of railCells)
    if (a.id < b.id && hdist(a, b) === 1) { const pa = hpos(a.col, a.row), pb = hpos(b.col, b.row); segs.push({ x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, key: a.id + b.id }); }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: "block", width: "100%", height: "auto" }}>
      {cells.map(cell => {
        const { x, y } = hpos(cell.col, cell.row);
        const pts = hpts(x, y, HS - 1.5);
        const isAns = showAnswer && answer && cell.id === answer.id;
        const isHL = hlSet.has(cell.id);
        const dim = hoverClue && !isHL && !isAns;
        return (
          <g key={cell.id} onMouseEnter={() => setHov(cell.id)} onMouseLeave={() => setHov(null)}>
            <polygon points={pts} fill={TERRAIN[cell.terrain].fill}
              stroke={isAns ? "#9a2a1e" : isHL ? "#fff4d8" : "#5a4632"}
              strokeWidth={isAns ? 3 : isHL ? 2.2 : 0.7} opacity={dim ? 0.25 : 1}
              className="lab-hex"
              style={{ transition: "opacity 0.25s, stroke-width 0.15s", transformBox: "fill-box", transformOrigin: "center", animation: `labTile 0.4s cubic-bezier(0.2,0.9,0.3,1.2) both`, animationDelay: `${((cell.col + cell.row) * 0.02).toFixed(3)}s` }} />
            {isHL && !isAns && <polygon points={pts} fill="#fff4d8" opacity={0.22} stroke="none" />}
          </g>
        );
      })}
      {segs.map(s => <line key={s.key} {...s} stroke="#3a2c1a" strokeWidth={3} strokeLinecap="round" opacity={0.75} />)}
      {segs.map(s => <line key={s.key + "d"} {...s} stroke="#c4b596" strokeWidth={0.8} strokeDasharray="2 4" strokeLinecap="round" />)}
      {cells.map(cell => {
        const { x, y } = hpos(cell.col, cell.row);
        const isAns = showAnswer && answer && cell.id === answer.id;
        const dim = hoverClue && !hlSet.has(cell.id) && !isAns;
        if (isAns) return (
          <g key={`a-${cell.id}`}>
            <circle cx={x} cy={y} r={HS * 0.55} fill="none" stroke="#9a2a1e" strokeWidth={2} opacity={0.85} style={{ animation: "pulse 1.6s ease-in-out infinite" }} />
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={15} style={{ pointerEvents: "none" }}>👹</text>
          </g>
        );
        return cell.features.map(f => (
          <text key={`f-${cell.id}-${f}`} x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={12} opacity={dim ? 0.3 : 1} style={{ pointerEvents: "none" }}>{FEATURE[f].icon}</text>
        ));
      })}
    </svg>
  );
}

// ── dispatch (clue card) ─────────────────────────────────────
function Dispatch({ clue, avgSupport, idx, isHov, onEnter, onLeave }) {
  const fac = FACTION[clue.faction];
  const pct = Math.round(clue.support / TOTAL * 100);
  const dev = Math.abs(clue.support - avgSupport) / TOTAL;  // deviation from group avg
  const fairC = dev < 0.07 ? "#4a7c3a" : dev < 0.16 ? "#9a7a2a" : "#9a2a1e";
  const diff = Math.round(clue.support - avgSupport);
  const contribOk = clue.contribution > 0;
  return (
    <div className="dispatch" onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={{ animation: `riseIn 0.5s ease both`, animationDelay: `${idx * 0.07}s`, borderLeftColor: fac.color, borderColor: isHov ? fac.color : "#c4b596" }}>
      <div className="dispatch-head">
        <span className="dispatch-faction" style={{ color: fac.color }}>{fac.icon} {fac.th}</span>
        <span className="clue-code" style={{ color: fac.color, borderColor: fac.color }}>{clue.code}</span>
        <span className="dev-badge" style={{ color: fairC, borderColor: fairC, marginLeft: "auto" }}>
          {diff === 0 ? "≈ ค่าเฉลี่ย" : diff > 0 ? `+${diff} จากเฉลี่ย` : `${diff} จากเฉลี่ย`}
        </span>
      </div>
      <div className="dispatch-body">{clue.label}</div>
      <div className="dispatch-rule" />
      <div className="dispatch-metrics">
        <div style={{ flex: 1 }}>
          <div className="metric-row">
            <span className="metric-label">ผู้ต้องสงสัยคงเหลือ</span>
            <span style={{ color: fairC, fontWeight: 700, fontSize: "0.66rem" }}>{clue.support} ช่อง ({pct}%)</span>
          </div>
          <div className="bar"><div className="bar-fill" style={{ width: `${pct}%`, background: fairC }} /></div>
        </div>
        <div className="contrib">
          <span className="metric-label">น้ำหนัก</span>
          <span className="contrib-badge" style={{ color: contribOk ? "#4a7c3a" : "#9a2a1e", borderColor: contribOk ? "#4a7c3a" : "#9a2a1e" }}>
            {contribOk ? `ตัด +${clue.contribution}` : "ซ้ำซ้อน"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════
export default function SteamGazetteLab() {
  const [cells, setCells] = useState(() => makeBoard());
  const [players, setPlayers] = useState(4);
  const [target, setTarget] = useState("any");
  const [puzzle, setPuzzle] = useState(null);
  const [showAns, setShowAns] = useState(false);
  const [hovIdx, setHovIdx] = useState(null);
  const [library, setLibrary] = useState([]);
  const [failMsg, setFailMsg] = useState(null);
  const [filter, setFilter] = useState(null); // {players, tier}
  const [codexPopup, setCodexPopup] = useState(null);
  const [genId, setGenId] = useState(0);
  const stampKey = useRef(0);

  const avgSupport = useMemo(() => puzzle ? puzzle.clues.reduce((s, c) => s + c.support, 0) / puzzle.clues.length : 0, [puzzle]);
  const hoverClue = useMemo(() => (hovIdx === null || !puzzle) ? null : puzzle.clues[hovIdx], [hovIdx, puzzle]);
  const headline = puzzle
    ? `จุดเดียวที่ intel ทุกสมาคมตัดกัน คือช่อง (${puzzle.answer.col},${puzzle.answer.row})`
    : "ยังไม่มีเบาะแส กดออกหมายล่าฉบับใหม่";
  const typed = useTypewriter(headline, 20);

  function generate() {
    setFailMsg(null);
    const nc = makeBoard(); setCells(nc);
    const res = genPuzzle(nc, players, target);
    if (!res) { setFailMsg("จัดชุด intel ไม่ลงตัว ลองออกหมายใหม่อีกครั้ง"); setPuzzle(null); }
    else { setPuzzle(res); stampKey.current++; }
    setShowAns(false); setHovIdx(null); setGenId(g => g + 1);
  }
  function reClue() {
    setFailMsg(null);
    const res = genPuzzle(cells, players, target);
    if (!res) setFailMsg("แผนที่นี้ไม่มีชุด intel ที่เหมาะ ลองสร้างแผนที่ใหม่");
    else { setPuzzle(res); setHovIdx(null); stampKey.current++; }
  }
  function save() {
    if (!puzzle) return;
    setLibrary(l => [...l, serialize(cells, puzzle, players)]);
  }
  function exportJSON() {
    // ส่งออกเป็น flat array รูปแบบเดียวกับ maps.json ที่ host/companion อ่าน
    // เรียงตามจำนวนผู้เล่น (3→4→5) แล้วใส่ index 0..N + id = map_NN
    const ordered = [...library].sort((a, b) => a.players - b.players);
    const presets = ordered.map((e, i) => ({
      id: `map_${String(i).padStart(2, "0")}`,
      index: i,
      players: e.players,
      factions: e.factions || e.clues.map(c => c.faction),
      clueTier: e.clueTier,
      result: e.result,
      fairness: e.fairness,
      avgPct: e.avgPct,
      board: e.board,
      answerCell: e.answerCell,
      clues: e.clues,
    }));
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `maps.json` });
    a.click();
  }
  function removeFromLib(id) { setLibrary(l => l.filter(e => e.id !== id)); }

  const fairnessPct = puzzle ? Math.round(puzzle.fairness * 100) : 0;
  const fairColor = !puzzle ? "#8a7a62" : fairnessPct >= 80 ? "#4a7c3a" : fairnessPct >= 60 ? "#9a7a2a" : "#9a2a1e";
  const today = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

  // library matrix counts (2-tier)
  const counts = useMemo(() => {
    const m = { 3: { easy: 0, hard: 0 }, 4: { easy: 0, hard: 0 }, 5: { easy: 0, hard: 0 } };
    for (const e of library) if (m[e.players] && m[e.players][e.clueTier] !== undefined) m[e.players][e.clueTier]++;
    return m;
  }, [library]);
  const filtered = useMemo(() => filter ? library.filter(e => e.players === filter.players && e.clueTier === filter.tier) : library, [library, filter]);

  return (
    <div className="gazette">
      <style>{CSS}</style>

      {/* MASTHEAD */}
      <div className="masthead">
        <div className="masthead-side">แฟ้ม No. {1847 + library.length}</div>
        <div className="masthead-center">
          <h1 className="gazette-title">The Dossier</h1>
          <div className="masthead-rule"><span>โรงงานผลิตปริศนา · ห้องเก็บแฟ้มลับ</span></div>
        </div>
        <div className="masthead-side right">ฉบับ {today}</div>
      </div>

      <div className="thick-rule" />

      {/* BODY */}
      <div className="columns">
        {/* LEFT map */}
        <div className="col col-map">
          {/* control group 1: ใกล้ map */}
          <div className="map-controls">
            <button className="btn btn-primary" onClick={generate}>✒ ออกหมายล่าฉบับใหม่</button>
            {puzzle && <>
              <button className="btn" onClick={reClue}>↻ สลับชุด intel</button>
              <button className={`btn ${showAns ? "btn-on" : ""}`} onClick={() => setShowAns(s => !s)}>{showAns ? "ปิดเฉลย" : "👁 เปิดเฉลย"}</button>
            </>}
          </div>
          <div className="map-frame">
            <HexBoard key={genId} cells={cells} answer={puzzle?.answer} hoverClue={hoverClue} showAnswer={showAns} />
          </div>
          <div className="map-caption">ภาพแกะลายโลหะ · ปีศาจแฝงตัว ณ ที่ใดที่หนึ่ง</div>
          <div className="legend-group">
            <div className="legend-row">
              <span className="legend-cat">ภูมิประเทศ</span>
              {Object.entries(TERRAIN).map(([k, v]) => <span key={k} className="leg-item"><span className="leg-swatch" style={{ background: v.fill }} />{v.label}</span>)}
            </div>
            <div className="legend-row">
              <span className="legend-cat">สิ่งก่อสร้าง</span>
              {Object.entries(FEATURE).map(([k, v]) => <span key={k} className="leg-item">{v.icon} {v.label}</span>)}
              <span className="leg-item">🛤 รางรถไฟ</span>
            </div>
            <div className="legend-row">
              <span className="legend-cat">เป้าหมาย</span>
              <span className="leg-item" style={{ color: "#9a2a1e" }}>👹 ราชาปีศาจ</span>
            </div>
          </div>
          {failMsg && <div className="fail-note">⚠ {failMsg}</div>}
        </div>

        <div className="col-divider" />

        {/* CENTER dispatches */}
        <div className="col col-center">
          {/* control group 2: ใกล้รายงานลับ */}
          <div className="center-controls">
            <span className="ctl-label">นักล่า</span>
            {[3, 4, 5].map(n => <button key={n} className={`btn-num ${players === n ? "on" : ""}`} onClick={() => { setPlayers(n); setPuzzle(null); }}>{n}</button>)}
            <span className="ctl-label" style={{ marginLeft: 8 }}>ระดับ clue</span>
            {[["any", "ทั้งหมด"], ["easy", "ง่าย"], ["hard", "ยาก"]].map(([k, l]) => (
              <button key={k} className={`btn-tier ${target === k ? "on" : ""}`}
                style={target === k && k !== "any" ? { background: TIERS[k].c, borderColor: TIERS[k].c, color: "#e9e1cd" } : {}}
                onClick={() => setTarget(k)}>{l}</button>
            ))}
          </div>
          {!puzzle ? (
            <div className="empty">
              <div className="empty-glyph">⚙</div>
              <div className="empty-text">ยังไม่มีหมายล่า<br /><span>กด "ออกหมายล่าฉบับใหม่" เพื่อเริ่ม</span></div>
            </div>
          ) : (
            <>
              <div className="bulletin">
                <div className="bulletin-kicker">
                  <span>★ ข่าวด่วน ★</span>
                  {puzzle.allContrib
                    ? <span className="news-stamp ok">✓ VERIFIED · ทุก clue มีบทบาท</span>
                    : <span className="news-stamp bad">⚠ มี clue ซ้ำซ้อน · ควรสลับชุด intel</span>}
                </div>
                <div className="bulletin-headline">{typed}<span className="caret">▌</span></div>
              </div>

              <div className="verdict" key={stampKey.current}>
                <div className="verdict-item">
                  <div className="verdict-label">คำตอบเดียว</div>
                  <div className="verdict-val" style={{ color: "#4a7c3a" }}>๑ ช่อง</div>
                </div>
                <div className="v-div" />
                <div className="verdict-item">
                  <div className="verdict-label">ความแฟร์</div>
                  <div className="verdict-val" style={{ color: fairColor }}>{fairnessPct}</div>
                </div>
                <div className="v-div" />
                <div className="verdict-item">
                  <div className="verdict-label">ผลเฉลี่ยการค้นหา</div>
                  <div className="tier-pill" style={{ background: RESULT[puzzle.result].c }}>{RESULT[puzzle.result].th}</div>
                  <div className="tier-sub">เฉลี่ย {Math.round(puzzle.avgPct * 100)}% ต่อ clue · clue {TIERS[puzzle.clueTier] ? TIERS[puzzle.clueTier].th : "ผสม"}</div>
                </div>
                <div className="v-div" />
                <div className="verdict-item">
                  <div className="verdict-label">พิกัดปีศาจ</div>
                  <div className="verdict-val mono" style={{ color: "#9a2a1e" }}>({puzzle.answer.col},{puzzle.answer.row}) {TERRAIN[puzzle.answer.terrain].icon}</div>
                </div>
                <button className="btn btn-save" onClick={save}>＋ เก็บเข้าแฟ้ม ({players}P)</button>
              </div>

              <div className="col-head" style={{ marginTop: 4 }}>รายงานลับจากแต่ละสมาคม</div>
              <div className="dispatch-hint">สีแถบ = ความใกล้ค่าเฉลี่ย · 🟢 ใกล้ (แฟร์) · 🔴 ห่าง (ไม่สมดุล) · hover เพื่อฉายช่องบนแผนที่</div>
              <div className="dispatches">
                {puzzle.clues.map((clue, i) => (
                  <Dispatch key={`${clue.faction}-${i}`} clue={clue} avgSupport={avgSupport} idx={i}
                    isHov={hovIdx === i} onEnter={() => setHovIdx(i)} onLeave={() => setHovIdx(null)} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="col-divider" />

        {/* RIGHT archive */}
        <div className="col col-archive">
          <div className="col-head">แฟ้มจดหมายเหตุ ({library.length})</div>

          {/* matrix */}
          <div className="matrix">
            <div className="matrix-row matrix-header">
              <span className="mx-corner"></span>
              {["easy", "hard"].map(t => <span key={t} className="mx-h" style={{ color: TIERS[t].c }}>{TIERS[t].th}</span>)}
            </div>
            {[3, 4, 5].map(p => (
              <div key={p} className="matrix-row">
                <span className="mx-p">{p}P</span>
                {["easy", "hard"].map(t => {
                  const active = filter && filter.players === p && filter.tier === t;
                  const n = counts[p][t];
                  return (
                    <button key={t} className={`mx-cell ${active ? "on" : ""} ${n ? "has" : ""}`}
                      style={active ? { background: TIERS[t].c, color: "#e9e1cd", borderColor: TIERS[t].c } : {}}
                      onClick={() => setFilter(active ? null : (n ? { players: p, tier: t } : null))}>
                      {n}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {library.length > 0 && (
            <div className="archive-tools">
              {filter && <button className="btn btn-ghost mini" onClick={() => setFilter(null)}>✕ ล้างตัวกรอง</button>}
              <button className="btn btn-export mini" onClick={exportJSON}>⬇ ส่งออก maps.json ({library.length})</button>
            </div>
          )}
          {library.length > 0 && (
            <div className="export-hint">บันทึกเป็น <b>maps.json</b> วางในโฟลเดอร์เดียวกับ host.html / companion.html แล้วลบบล็อก DEMO MAPS ออกตอน deploy</div>
          )}

          <div className="archive-list scroll5">
            {filtered.length === 0
              ? <div className="archive-empty">{filter ? "ช่องนี้ยังว่าง" : "ยังว่างเปล่า"}</div>
              : filtered.map((p) => {
                const gi = library.indexOf(p);
                return (
                  <div key={p.id} className="archive-item">
                    <div className="ai-line1">
                      <span className="ai-no">#{gi + 1}</span>
                      <span className="ai-result" style={{ color: RESULT[p.result].c, borderColor: RESULT[p.result].c }}>{RESULT[p.result].th}</span>
                      <span className="ai-meta">{p.players} คน · แฟร์ {p.fairness}</span>
                      <button className="ai-del" onClick={() => removeFromLib(p.id)}>✕</button>
                    </div>
                    <div className="ai-codes">{p.clues.map(c => <span key={c.code} className="ai-code" style={{ color: FACTION[c.faction].color }}>{FACTION[c.faction].icon}{c.code}</span>)}</div>
                  </div>
                );
              })}
          </div>

          {/* CODEX below the archive */}
          <div className="col-head" style={{ marginTop: 14 }}>บัญชีสมาคม</div>
          <div className="codex-side">
            {FACTIONS.map(f => { const fc = FACTION[f]; return (
              <button key={f} className="codex-row" style={{ borderLeftColor: fc.color }} onClick={() => setCodexPopup(f)}>
                <span className="codex-row-icon" style={{ color: fc.color }}>{fc.icon}</span>
                <span className="codex-row-info">
                  <span className="codex-row-name" style={{ color: fc.color }}>{fc.th} <span className="codex-row-code">{FAC_CODE[f]}</span></span>
                  <span className="codex-row-theme">{fc.theme}</span>
                </span>
                <span className="codex-row-more">ดู clue →</span>
              </button>
            ); })}
          </div>
        </div>
      </div>

      {/* CODEX POPUP */}
      {codexPopup && (() => {
        const fc = FACTION[codexPopup];
        const list = CLUE_POOL.filter(c => c.faction === codexPopup && c.tier === "easy");
        return (
          <div className="popup-overlay" onClick={() => setCodexPopup(null)}>
            <div className="popup" onClick={e => e.stopPropagation()} style={{ borderTopColor: fc.color }}>
              <div className="popup-head">
                <div>
                  <div className="popup-icon" style={{ color: fc.color }}>{fc.icon} <span className="popup-name">{fc.th}</span> <span className="popup-code" style={{ borderColor: fc.color, color: fc.color }}>{FAC_CODE[codexPopup]}</span></div>
                  <div className="popup-theme" style={{ color: fc.color }}>{fc.theme}</div>
                </div>
                <button className="btn btn-ghost mini" onClick={() => setCodexPopup(null)}>✕ ปิด</button>
              </div>
              <div className="popup-flavor">{fc.flavor}</div>
              <div className="popup-sources">
                {fc.sources.map(([ic, lb], i) => <span key={i} className="codex-src">{ic} {lb}</span>)}
              </div>
              <div className="popup-cluehead">ชุด clue ระดับ <span style={{ color: TIERS.easy.c, fontWeight: 700 }}>ง่าย</span> ({list.length} ใบ)</div>
              <div className="popup-cluelist">
                {list.map(c => (
                  <div key={c.code} className="popup-clue">
                    <span className="popup-clue-code" style={{ color: fc.color, borderColor: fc.color }}>{c.code}</span>
                    <span className="popup-clue-label">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function serialize(cells, puzzle, players) {
  return {
    id: `pz_${Date.now()}_${Math.floor(Math.random() * 999)}`,
    players,
    factions: puzzle.clues.map(c => c.faction),   // ลำดับ faction = ลำดับผู้เล่น (host/companion ใช้)
    clueTier: puzzle.clueTier,                 // clue แบบไหน (ง่าย/ยาก/ผสม)
    result: puzzle.result,                      // ผลเฉลี่ย: ตรงเป้า/พอเป็นไปได้/กำกวม
    fairness: Math.round(puzzle.fairness * 100),
    avgPct: Math.round(puzzle.avgPct * 100),
    board: cells.map(({ col, row, terrain, features, rail }) => ({ col, row, terrain, features, rail })),
    answerCell: { col: puzzle.answer.col, row: puzzle.answer.row },
    clues: puzzle.clues.map(c => ({
      code: c.code, faction: c.faction, tier: c.tier, type: c.type, label: c.label, tplKey: c.tplKey,
      params: { feat: c.feat, feats: c.feats, dist: c.dist, terrain: c.terrain, terrains: c.terrains },
      meta: { support: c.support, contribution: c.contribution },
    })),
  };
}

const CSS = `
.gazette{
  --paper:#e9e1cd; --paper2:#e2d8bf; --ink:#241c12; --ink2:#5a4c38; --ink3:#8a7a62;
  --rule:#c4b596; --red:#9a2a1e; --sepia:#8a6a3a;
  min-height:100vh; background:
    repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(120,90,50,0.012) 3px, rgba(120,90,50,0.012) 4px),
    radial-gradient(ellipse 90% 60% at 50% 0%, #efe8d6, #e4dabf);
  color:var(--ink); font-family:Georgia,'Times New Roman',serif; padding:14px 18px 30px;
}
.gazette *{box-sizing:border-box;}
.masthead{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;padding:6px 4px 10px;}
.masthead-side{font-size:0.68rem;color:var(--ink2);font-style:italic;white-space:nowrap;padding-bottom:6px;}
.masthead-side.right{text-align:right;}
.masthead-center{text-align:center;flex:1;}
.gazette-title{margin:0;font-size:2.7rem;font-weight:900;line-height:1;font-family:'Playfair Display',Georgia,serif;text-shadow:0 1px 0 rgba(255,255,255,0.4);}
.masthead-rule{display:flex;align-items:center;gap:10px;margin-top:7px;}
.masthead-rule:before,.masthead-rule:after{content:"";flex:1;border-top:2px solid var(--ink);border-bottom:1px solid var(--ink);}
.masthead-rule span{font-size:0.66rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--ink2);white-space:nowrap;}
.control-strip{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);margin-top:4px;flex-wrap:wrap;}
.control-left,.control-right{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.btn{font-family:Georgia,serif;font-size:0.74rem;padding:6px 13px;border:1px solid var(--ink2);background:var(--paper);color:var(--ink);cursor:pointer;border-radius:1px;transition:all 0.15s;box-shadow:1px 1px 0 rgba(36,28,18,0.18);}
.btn:hover{background:var(--ink);color:var(--paper);transform:translate(-1px,-1px);box-shadow:2px 2px 0 rgba(36,28,18,0.25);}
.btn:active{transform:translate(0,0);box-shadow:none;}
.btn-primary{background:var(--ink);color:var(--paper);font-weight:700;}
.btn-primary:hover{background:var(--red);}
.btn-on{background:var(--sepia);color:var(--paper);}
.btn-ghost{border-style:dashed;}
.btn-ghost.mini{font-size:0.62rem;padding:3px 8px;}
.btn-export{font-size:0.66rem;padding:5px 12px;background:var(--ink);color:var(--paper);font-weight:700;border-color:var(--ink);}
.btn-export:hover{background:#4a7c3a;border-color:#4a7c3a;}
.btn-export.mini{font-size:0.64rem;}
.export-hint{font-size:0.58rem;color:var(--ink3);font-style:italic;line-height:1.5;margin-top:6px;padding:6px 8px;background:rgba(120,90,50,0.05);border-left:2px solid var(--rule);}
.ctl-label{font-size:0.64rem;color:var(--ink2);font-style:italic;margin-left:6px;}
.btn-num{font-family:Georgia,serif;width:28px;height:28px;border:1px solid var(--ink2);background:var(--paper);color:var(--ink2);cursor:pointer;border-radius:1px;font-size:0.82rem;transition:all 0.13s;}
.btn-num.on{background:var(--red);color:var(--paper);border-color:var(--red);font-weight:700;}
.btn-tier{font-family:Georgia,serif;font-size:0.68rem;padding:4px 10px;border:1px solid var(--ink2);background:var(--paper);color:var(--ink2);cursor:pointer;border-radius:1px;transition:all 0.13s;}
.btn-tier.on{font-weight:700;}
.codex{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:11px 0 4px;animation:riseIn 0.4s ease both;}
.codex-card{padding:10px 11px;background:var(--paper2);border:1px solid var(--rule);border-top:3px solid;border-radius:1px;display:flex;flex-direction:column;gap:4px;}
.codex-top{display:flex;align-items:center;gap:6px;}
.codex-icon{font-size:1.15rem;line-height:1;}
.codex-name{font-size:0.76rem;font-weight:800;}
.codex-intel{font-size:0.6rem;color:var(--ink3);font-style:italic;}
.codex-theme{font-size:0.64rem;font-weight:700;line-height:1.3;}
.codex-sources{display:flex;flex-wrap:wrap;gap:3px;margin-top:2px;}
.codex-src{font-size:0.56rem;color:var(--ink2);background:rgba(120,90,50,0.08);border:1px solid var(--rule);border-radius:2px;padding:1px 5px;}
.codex-flavor{font-size:0.58rem;color:var(--ink3);line-height:1.5;margin-top:2px;border-top:1px dotted var(--rule);padding-top:5px;}
.thick-rule{border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);margin:8px 0 12px;}
.columns{display:flex;align-items:stretch;}
.col-divider{border-left:1px solid var(--rule);margin:0 14px;}
.col-head{font-size:0.64rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink2);border-bottom:2px solid var(--ink);padding-bottom:4px;margin-bottom:9px;font-weight:700;}
.col-map{width:500px;flex-shrink:0;}
.map-frame{border:1px solid var(--ink);padding:6px;background:var(--paper2);box-shadow:2px 2px 0 rgba(36,28,18,0.12);}
.map-caption{text-align:center;font-size:0.62rem;font-style:italic;color:var(--ink2);margin-top:6px;}
.legend-group{margin-top:11px;padding-top:9px;border-top:1px dotted var(--rule);display:flex;flex-direction:column;gap:6px;}
.legend-row{display:flex;gap:9px;flex-wrap:wrap;align-items:center;}
.legend-cat{font-size:0.55rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3);font-weight:700;min-width:96px;border-right:1px solid var(--rule);padding-right:8px;}
.leg-item{display:flex;align-items:center;gap:3px;font-size:0.62rem;color:var(--ink2);}
.leg-swatch{width:11px;height:11px;border:1px solid var(--ink3);border-radius:1px;flex-shrink:0;}
.fail-note{margin-top:10px;padding:7px 10px;font-size:0.7rem;color:var(--red);border:1px dashed var(--red);background:rgba(154,42,30,0.05);}
.col-center{flex:1;min-width:0;}
.empty{height:100%;min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--ink3);}
.empty-glyph{font-size:3rem;opacity:0.3;animation:spin 9s linear infinite;}
.empty-text{text-align:center;margin-top:10px;font-size:0.9rem;font-style:italic;}
.empty-text span{font-size:0.74rem;color:var(--ink3);}
.bulletin{border:2px solid var(--ink);padding:10px 14px;background:var(--paper2);margin-bottom:11px;}
.bulletin-kicker{display:flex;align-items:center;gap:10px;font-size:0.6rem;letter-spacing:0.3em;color:var(--red);font-weight:700;margin-bottom:5px;}
.news-stamp{letter-spacing:0.04em;font-size:0.62rem;padding:2px 9px;border:1.5px solid;border-radius:2px;animation:stampIn2 0.4s cubic-bezier(0.3,1.3,0.5,1) both;}
.news-stamp.ok{color:#4a7c3a;border-color:#4a7c3a;background:rgba(74,124,58,0.07);}
.news-stamp.bad{color:var(--red);border-color:var(--red);background:rgba(154,42,30,0.07);}
.bulletin-headline{font-size:1.05rem;font-weight:700;line-height:1.4;min-height:1.5em;}
.caret{color:var(--red);animation:blink 0.9s step-end infinite;}
.verdict{display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid var(--ink);background:var(--paper);position:relative;margin-bottom:14px;box-shadow:2px 2px 0 rgba(36,28,18,0.1);flex-wrap:wrap;}
.verdict-label{font-size:0.55rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink3);margin-bottom:3px;}
.verdict-val{font-size:1.5rem;font-weight:900;line-height:1;font-family:'Playfair Display',Georgia,serif;}
.verdict-val.mono{font-size:0.95rem;font-family:'Courier New',monospace;}
.v-div{width:1px;align-self:stretch;background:var(--rule);}
.tier-pill{display:inline-block;padding:3px 12px;border-radius:2px;color:#e9e1cd;font-weight:800;font-size:0.85rem;}
.tier-sub{font-size:0.54rem;color:var(--ink3);margin-top:3px;}
.btn-save{margin-left:auto;background:var(--ink);color:var(--paper);font-weight:700;}
.btn-save:hover{background:#4a7c3a;}
.dispatch-hint{font-size:0.62rem;font-style:italic;color:var(--ink3);margin-bottom:8px;}
.dispatches{display:flex;flex-direction:column;gap:8px;}
.dispatch{border:1px solid var(--rule);border-left:3px solid;padding:10px 12px;background:var(--paper2);border-radius:1px;transition:transform 0.18s,box-shadow 0.18s,border-color 0.18s;}
.dispatch:hover{transform:translateY(-3px);box-shadow:3px 4px 0 rgba(36,28,18,0.14);}
.dispatch-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;}
.dispatch-faction{font-size:0.72rem;font-weight:800;}
.dev-badge{font-size:0.56rem;font-weight:700;padding:1px 7px;border:1px solid;border-radius:1px;}
.dispatch-body{font-size:0.82rem;color:var(--ink);line-height:1.45;}
.dispatch-rule{border-top:1px dotted var(--rule);margin:8px 0;}
.dispatch-metrics{display:flex;gap:12px;align-items:flex-end;}
.metric-row{display:flex;justify-content:space-between;margin-bottom:3px;}
.metric-label{font-size:0.55rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink3);}
.bar{height:3px;background:rgba(120,90,50,0.15);border-radius:2px;overflow:hidden;}
.bar-fill{height:100%;border-radius:2px;transition:width 0.4s ease;}
.contrib{text-align:center;flex-shrink:0;}
.contrib-badge{display:inline-block;margin-top:2px;font-size:0.6rem;font-weight:700;padding:1px 7px;border:1px solid;border-radius:1px;}
.col-archive{width:248px;flex-shrink:0;}
.matrix{display:flex;flex-direction:column;gap:3px;margin-bottom:9px;}
.matrix-row{display:grid;grid-template-columns:30px 1fr 1fr;gap:3px;align-items:center;}
.matrix-header .mx-h{font-size:0.56rem;text-align:center;font-weight:700;letter-spacing:0.04em;}
.mx-corner{}
.mx-p{font-size:0.64rem;font-weight:800;color:var(--ink2);}
.mx-cell{font-family:Georgia,serif;height:26px;border:1px solid var(--rule);background:var(--paper2);color:var(--ink3);cursor:pointer;border-radius:1px;font-size:0.74rem;transition:all 0.13s;}
.mx-cell.has{color:var(--ink);font-weight:700;border-color:var(--ink2);}
.mx-cell:hover{border-color:var(--ink);}
.archive-tools{display:flex;gap:6px;margin-bottom:8px;}
.archive-list{display:flex;flex-direction:column;gap:5px;}
.scroll5{max-height:188px;overflow-y:auto;padding-right:3px;border:1px solid var(--rule);background:rgba(120,90,50,0.03);padding:7px;border-radius:2px;}
.archive-empty{font-size:0.66rem;color:var(--ink3);font-style:italic;text-align:center;padding:14px 0;}
.archive-item{padding:6px 8px;background:var(--paper2);border:1px solid var(--rule);border-radius:1px;display:flex;flex-direction:column;gap:4px;}
.ai-line1{display:flex;align-items:center;gap:6px;}
.ai-no{font-size:0.64rem;font-weight:800;color:var(--ink);}
.ai-result{font-size:0.56rem;font-weight:700;padding:1px 6px;border:1px solid;border-radius:1px;}
.ai-meta{font-size:0.56rem;color:var(--ink2);}
.ai-del{margin-left:auto;border:none;background:none;color:var(--ink3);cursor:pointer;font-size:0.7rem;padding:0 2px;}
.ai-del:hover{color:var(--red);}
.ai-codes{display:flex;flex-wrap:wrap;gap:4px;}
.ai-code{font-size:0.56rem;font-family:'Courier New',monospace;font-weight:700;background:rgba(120,90,50,0.07);border:1px solid var(--rule);border-radius:2px;padding:0 4px;}
/* control groups */
.map-controls{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px;}
.center-controls{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:11px;padding-bottom:10px;border-bottom:1px solid var(--rule);}
.ctl-label{font-size:0.62rem;color:var(--ink2);font-style:italic;}
/* codex side (right column) */
.codex-side{display:flex;flex-direction:column;gap:5px;}
.codex-row{display:flex;align-items:center;gap:8px;text-align:left;font-family:Georgia,serif;cursor:pointer;
  background:var(--paper2);border:1px solid var(--rule);border-left:3px solid;border-radius:1px;padding:7px 9px;transition:all 0.15s;}
.codex-row:hover{transform:translateX(2px);box-shadow:2px 2px 0 rgba(36,28,18,0.12);}
.codex-row-icon{font-size:1.1rem;line-height:1;}
.codex-row-info{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0;}
.codex-row-name{font-size:0.72rem;font-weight:800;}
.codex-row-code{font-size:0.56rem;font-family:'Courier New',monospace;color:var(--ink3);font-weight:700;}
.codex-row-theme{font-size:0.58rem;color:var(--ink2);}
.codex-row-more{font-size:0.58rem;color:var(--ink3);white-space:nowrap;}
.codex-src{font-size:0.56rem;color:var(--ink2);background:rgba(120,90,50,0.08);border:1px solid var(--rule);border-radius:2px;padding:1px 5px;}
/* popup */
.popup-overlay{position:fixed;inset:0;background:rgba(20,14,8,0.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px;z-index:50;animation:fadeIn 0.18s ease both;}
.popup{background:var(--paper);border:1px solid var(--ink);border-top:4px solid;max-width:520px;width:100%;max-height:82vh;overflow-y:auto;padding:20px 22px;box-shadow:4px 6px 0 rgba(36,28,18,0.25);animation:popIn 0.25s cubic-bezier(0.3,1.3,0.5,1) both;}
.popup-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
.popup-icon{font-size:1.1rem;font-weight:800;}
.popup-name{font-size:1.15rem;font-weight:900;font-family:'Playfair Display',Georgia,serif;}
.popup-code{font-size:0.62rem;font-family:'Courier New',monospace;border:1px solid;border-radius:2px;padding:1px 6px;font-weight:700;vertical-align:middle;}
.popup-theme{font-size:0.72rem;font-weight:700;margin-top:3px;}
.popup-flavor{font-size:0.72rem;color:var(--ink2);line-height:1.6;margin:12px 0;font-style:italic;border-left:2px solid var(--rule);padding-left:10px;}
.popup-sources{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px;}
.popup-cluehead{font-size:0.64rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink2);font-weight:700;border-bottom:2px solid var(--ink);padding-bottom:4px;margin-bottom:9px;}
.popup-cluelist{display:flex;flex-direction:column;gap:5px;}
.popup-clue{display:flex;gap:9px;align-items:baseline;padding:6px 8px;background:var(--paper2);border:1px solid var(--rule);border-radius:1px;}
.popup-clue-code{font-size:0.6rem;font-family:'Courier New',monospace;font-weight:700;border:1px solid;border-radius:2px;padding:1px 5px;flex-shrink:0;}
.popup-clue-label{font-size:0.78rem;color:var(--ink);line-height:1.4;}
.clue-code{font-size:0.56rem;font-family:'Courier New',monospace;font-weight:700;border:1px solid;border-radius:2px;padding:0 5px;}
@keyframes riseIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@keyframes stampIn{0%{opacity:0;transform:translateY(-50%) rotate(-11deg) scale(2.4);}60%{opacity:0.4;}100%{opacity:0.26;transform:translateY(-50%) rotate(-11deg) scale(1);}}
@keyframes blink{50%{opacity:0;}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{opacity:0.85;}50%{opacity:0.35;}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes popIn{from{opacity:0;transform:translateY(16px) scale(0.96);}to{opacity:1;transform:translateY(0) scale(1);}}
@keyframes stampIn2{0%{opacity:0;transform:rotate(-4deg) scale(1.6);}100%{opacity:1;transform:rotate(-4deg) scale(1);}}
@keyframes fadeUpSoft{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
@keyframes slideFade{from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:translateX(0);}}
@keyframes inkBleed{0%{opacity:0;filter:blur(6px);}100%{opacity:1;filter:blur(0);}}
@keyframes labTile{0%{transform:translateY(-10px) scale(0.72);}70%{transform:translateY(2px) scale(1.04);}100%{transform:translateY(0) scale(1);}}

/* staggered entrances for masthead + columns */
.masthead{animation:inkBleed 0.7s ease both;}
.col-map{animation:fadeUpSoft 0.55s 0.05s ease both;}
.col-center{animation:fadeUpSoft 0.55s 0.16s ease both;}
.col-archive{animation:fadeUpSoft 0.55s 0.27s ease both;}
.codex-row{animation:slideFade 0.4s ease both;}
.codex-row:nth-child(1){animation-delay:0.30s;}
.codex-row:nth-child(2){animation-delay:0.37s;}
.codex-row:nth-child(3){animation-delay:0.44s;}
.codex-row:nth-child(4){animation-delay:0.51s;}
.codex-row:nth-child(5){animation-delay:0.58s;}
/* dispatches cascade in */
.dispatch{animation:fadeUpSoft 0.45s ease both;}
/* verdict pieces */
.verdict{animation:fadeUpSoft 0.5s ease both;}
/* smooth hovers everywhere */
.btn,.mx-cell,.codex-row,.archive-item,.leg-item,.pick-btn{transition:all 0.16s ease;}
.archive-item{animation:slideFade 0.35s ease both;}
.hex-cell{transition:opacity 0.18s ease, transform 0.18s ease;}

@media(max-width:1100px){
  .columns{flex-direction:column;}
  .col-divider{display:none;}
  .col-map,.col-center,.col-archive{width:100%;}
  .col-map,.col-center{margin-bottom:18px;}
}
@media(prefers-reduced-motion:reduce){
  *{animation-duration:0.01ms !important;animation-iteration-count:1 !important;}
}
`;
