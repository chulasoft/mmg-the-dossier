// ═══════════════════════════════════════════════════════════
//  THE DOSSIER · i18n.js
//  Shared translation dictionary + helpers, loaded by index/host/companion.
//  Default language: English. Persisted choice: localStorage "dossier_lang".
//  Lab (lab.html) embeds its own copy of this content (React bundle is
//  self-contained): keep the two in sync when editing wording.
// ═══════════════════════════════════════════════════════════
(function (global) {
  "use strict";

  // ── terrain / feature names (used to render clue labels live) ──
  var TERRAIN_NAME = {
    en: { factory: "the Factory District", smog: "Smog Alley", cemetery: "the Old Cemetery", slums: "the Slums", harbor: "the Harbor" },
    th: { factory: "ย่านโรงงาน", smog: "ตรอกหมอกควัน", cemetery: "สุสานเก่า", slums: "สลัมร้าง", harbor: "ท่าเรือ" },
  };
  var FEATURE_NAME = {
    en: { clock_tower: "the Clock Tower", station: "the Station", power_plant: "the Power Plant" },
    th: { clock_tower: "หอนาฬิกา", station: "สถานีรถไฟ", power_plant: "โรงไฟฟ้า" },
  };

  // ── clue templates, keyed by stable tplKey (assigned in buildCluePool) ──
  // fn(params) -> string. params: {dist, terrain, terrains:[a,b] or [a,b,c]}
  function tname(t, lang) { return TERRAIN_NAME[lang][t]; }
  function fname(t, lang) { return FEATURE_NAME[lang][t]; }

  var CLUE_TPL = {
    cw_power:   { en: p => "Within " + p.dist + " tiles of the Power Plant \u26A1", th: p => "ภายใน " + p.dist + " ช่องจากโรงไฟฟ้า \u26A1" },
    cw_factory: { en: p => "Within " + p.dist + " tiles of " + tname("factory", "en"), th: p => "ภายใน " + p.dist + " ช่องจากย่านโรงงาน \uD83C\uDFED" },
    cw_rail:    { en: p => "Within " + p.dist + " tiles of the Rail Line \uD83D\uDE84", th: p => "ภายใน " + p.dist + " ช่องจากรางรถไฟ \uD83D\uDE84" },
    cw_smog:    { en: p => "Following factory smoke, within " + p.dist + " tiles of " + tname("smog", "en"), th: p => "ตามควันโรงงาน ภายใน " + p.dist + " ช่องจากตรอกหมอกควัน \uD83C\uDF2B\uFE0F" },
    se_clock:   { en: p => "The clock's reach extends " + p.dist + " tiles from the Clock Tower \uD83D\uDD70", th: p => "เข็มเวลาแผ่ถึง ภายใน " + p.dist + " ช่องจากหอนาฬิกา \uD83D\uDD70" },
    se_cemetery:{ en: p => "The scent of death, within " + p.dist + " tiles of the Old Cemetery \u271D", th: p => "กลิ่นความตาย ภายใน " + p.dist + " ช่องจากสุสาน \u271D" },
    se_slums:   { en: p => "A haunting moan, within " + p.dist + " tiles of the Slums \uD83C\uDFDA", th: p => "เสียงครวญคราง ภายใน " + p.dist + " ช่องจากสลัมร้าง \uD83C\uDFDA" },
    se_smog:    { en: p => "A shadow in the fog, within " + p.dist + " tiles of " + tname("smog", "en"), th: p => "เงาในหมอก ภายใน " + p.dist + " ช่องจากตรอกหมอกควัน \uD83C\uDF2B\uFE0F" },
    as_terrain: { en: p => "A confession points to " + tname(p.terrain, "en"), th: p => "คำสารภาพชี้ว่าซ่อนใน" + TERRAIN_NAME.th[p.terrain] + " " + terrainIcon(p.terrain) },
    as_pair:    { en: p => "Hiding in " + tname(p.terrains[0], "en") + " or " + tname(p.terrains[1], "en"), th: p => "ซ่อนใน" + TERRAIN_NAME.th[p.terrains[0]] + "หรือ" + TERRAIN_NAME.th[p.terrains[1]] },
    as_triple:  { en: p => "Hiding in " + p.terrains.map(function (t) { return tname(t, "en"); }).join(" / "), th: p => p.terrains.map(function (t) { return TERRAIN_NAME.th[t]; }).join("/") + "ซ่อนอยู่ในที่ใดที่หนึ่ง" },
    la_allstruct: { en: p => "News network, within " + p.dist + " tiles of any structure \uD83D\uDD70\uD83D\uDE89\u26A1", th: p => "เครือข่ายข่าว ภายใน " + p.dist + " ช่องจากสิ่งปลูกสร้างใดๆ \uD83D\uDD70\uD83D\uDE89\u26A1" },
    la_downtown:  { en: p => "A downtown source, within " + p.dist + " tiles of the Clock Tower or Station \uD83D\uDD70\uD83D\uDE89", th: p => "แหล่งข่าวใจกลางเมือง ภายใน " + p.dist + " ช่องจากหอนาฬิกาหรือสถานี \uD83D\uDD70\uD83D\uDE89" },
    la_industrial:{ en: p => "An industrial tip, within " + p.dist + " tiles of the Station or Power Plant \uD83D\uDE89\u26A1", th: p => "สายข่าวอุตสาหกรรม ภายใน " + p.dist + " ช่องจากสถานีหรือโรงไฟฟ้า \uD83D\uDE89\u26A1" },
    la_paired:  { en: p => "A paired lead, within " + p.dist + " tiles of the Clock Tower or Power Plant \uD83D\uDD70\u26A1", th: p => "เบาะแสคู่ ภายใน " + p.dist + " ช่องจากหอนาฬิกาหรือโรงไฟฟ้า \uD83D\uDD70\u26A1" },
    cr_espionage: { en: p => "State espionage: sits on the Rail Line \uD83D\uDE84", th: p => "จารกรรมรัฐ อยู่บนรางรถไฟ \uD83D\uDE84" },
    cr_railnet: { en: p => "Rail network, within " + p.dist + " tiles of the Rail Line \uD83D\uDE84", th: p => "เครือข่ายราง ภายใน " + p.dist + " ช่องจากรางรถไฟ \uD83D\uDE84" },
    cr_harbor:  { en: p => "Harbor file, within " + p.dist + " tiles of the Harbor \uD83C\uDF0A", th: p => "แฟ้มท่าเรือ ภายใน " + p.dist + " ช่องจากท่าเรือ \uD83C\uDF0A" },
    cr_watchtower:{ en: p => "Watchtower sighting, within " + p.dist + " tiles of the Clock Tower \uD83D\uDD70", th: p => "หอสังเกตการณ์ ภายใน " + p.dist + " ช่องจากหอนาฬิกา \uD83D\uDD70" },
    cr_trainlog:{ en: p => "Train log entry, within " + p.dist + " tiles of the Station \uD83D\uDE89", th: p => "บันทึกขบวนรถ ภายใน " + p.dist + " ช่องจากสถานีรถไฟ \uD83D\uDE89" },
  };
  function terrainIcon(t) { return TERRAIN_ICON[t] || ""; }
  var TERRAIN_ICON = { factory: "\uD83C\uDFED", smog: "\uD83C\uDF2B\uFE0F", cemetery: "\u271D", slums: "\uD83C\uDFDA", harbor: "\uD83C\uDF0A" };

  function renderClueLabel(clue, lang) {
    lang = lang || getLang();
    var tpl = CLUE_TPL[clue.tplKey];
    if (!tpl) return clue.label || "";           // fallback for legacy data without tplKey
    try { return tpl[lang](clue.params || clue); }
    catch (e) { return clue.label || ""; }
  }

  // ── faction names + one-line descriptions (briefing cards) ──
  var FACTION_I18N = {
    en: {
      cogwork:   { name: "Cogwork Society", line: "The Cogwork Society taps every secret through steam pipes and iron rails spanning the city." },
      seance:    { name: "S\u00e9ance Circle",   line: "The S\u00e9ance Circle senses omens from the old cemetery and a clock's stopped hands." },
      ashen:     { name: "Ashen Order",     line: "The Ashen Order wrings truth from a demon caught alive, hunting for the ground it hides on." },
      lamplight: { name: "Lamplight Guild", line: "The Lamplight Guild gathers leads from its network of reporters across the city." },
      crown:     { name: "Iron Crown",      line: "The Iron Crown watches every platform and pier through the state's intelligence network." },
    },
    th: {
      cogwork:   { name: "สมาคมเฟืองจักร", line: "สมาคมเฟืองจักรดักฟังทุกความลับผ่านท่อไอน้ำและรางเหล็กที่พาดทั่วนคร" },
      seance:    { name: "คณะทรงญาณ",      line: "คณะทรงญาณสัมผัสลางร้ายจากสุสานเก่าและเสียงเข็มนาฬิกาที่หยุดเดิน" },
      ashen:     { name: "กลุ่มเถ้าธุลี",   line: "กลุ่มเถ้าธุลีรีดความจริงจากปากปีศาจที่จับเป็น เค้นหาภูมิประเทศที่มันหลบซ่อน" },
      lamplight: { name: "คณะตะเกียง",      line: "คณะตะเกียงสาวเบาะแสจากเครือข่ายนักข่าวรอบเมือง" },
      crown:     { name: "มงกุฎเหล็ก",      line: "มงกุฎเหล็กเฝ้าจับตาทุกชานชาลาและท่าเรือผ่านดวงตาของเจ้าหน้าที่รัฐ" },
    },
  };

  // ── epilogue lines per winning faction ──
  var EPILOGUE = {
    en: {
      cogwork:   "Every gear stops turning, if only for a moment, in respect for the one who closed the case tonight.",
      seance:    "The veil of spirits settles. The city's omens are put to rest.",
      ashen:     "Ash scatters to the wind. The demon's last truth burns to nothing.",
      lamplight: "Every lamp burns bright. Word of tonight's victory spreads across the city.",
      crown:     "The state bell tolls. Order returns to the clockwork city once more.",
    },
    th: {
      cogwork:   "เฟืองจักรทุกตัวหยุดหมุนชั่วขณะ เพื่อคารวะผู้ปิดคดีแห่งราตรี",
      seance:    "ม่านวิญญาณสงบลง ลางร้ายของนครถูกปัดเป่าจนสิ้น",
      ashen:     "เถ้าธุลีปลิดปลิว ความจริงสุดท้ายของปีศาจถูกเผาจนมอดไหม้",
      lamplight: "ตะเกียงทุกดวงลุกโชน พาดหัวข่าวแห่งชัยชนะส่องทั่วนคร",
      crown:     "ระฆังรัฐลั่นกังวาน ความสงบหวนคืนสู่นครจักรกลอีกครา",
    },
  };
  var EPILOGUE_HIDDEN = {
    en: "The Demon King is dead. The city falls back into silence.",
    th: "ราชาปีศาจดับสูญ นครกลับคืนสู่ความสงบสุข",
  };

  // ── briefing story: opening line by player count + closing line ──
  var STORY_OPEN = {
    en: {
      3: "A starless night. The Demon King walks the city disguised as a man. Three secret societies join forces in the shadows.",
      4: "Smog blankets the city. The Demon King is holed up somewhere. Four societies send their hitmen out on the same night.",
      5: "The midnight bell tolls. The Demon King stirs from hiding. All five societies of the city move as one.",
    },
    th: {
      3: "ค่ำคืนแห่งความหวาดกลัว เมื่อราชาปีศาจแหละเหล่าสมุนสวมรอยเป็นมนุษย์เดินปะปนในฝูงชน ก่อคดีไม่รู้จบ สามสมาคมเริ่มสั่นคลอน จนต้องออกมาเคลื่อนไหว",
      4: "หมอกควันปกคลุมนคร ราชาปีศาจแหละเหล่าสมุน เคลื่อนไหวในวงจรงานสีเทา สี่สมาคม หมดความอดทน ต่างส่งนักฆ่าออกล่าในคืนเดียวกัน",
      5: "ระฆังเที่ยงคืนลั่นกังวาน ราชาปีศาจแหละเหล่าสมุน ตื่นจากผนึกกักขัง ออกไล่ฆ่าฝูงชน และทำลายเครือข่ายองค์กรใต้ดืน เหล่าห้าสมาคมของนคร หมดความอดทน ส่งนักฆ่าออกล่าจนกว่าพวกมันจะวอดวาย",
    },
  };
  var STORY_CLOSE = {
    en: {
      3: "The leads are scattered between three hands. Only one bullet will find the mark.",
      4: "No society sees the whole picture; only trading word for word reveals the truth, and only one bullet will kill the Demon King.",
      5: "Five leads overlap into one puzzle. Whoever solves it first, and lands the shot, becomes the hero of the night.",
    },
    th: {
      3: "เบาะแสกระจัดกระจายในมือทั้งสามสมาคม มีเพียงกระสุนเดียวเท่านั้นที่จะสังหารราชาปีศาจได้สำเร็จ",
      4: "ไม่มีสมาคมใดเห็นภาพครบ ต้องแลกข่าวกันจึงจะรู้ความจริง และมีเพียงกระสุนเดียวเท่านั้นที่จะสังหารราชาปีศาจได้สำเร็จ",
      5: "ห้าเบาะแสซ้อนทับกันเป็นปริศนา ผู้ใดไขได้ก่อนจะสังหารราชาปีศาจได้สำเร็จ",
    },
  };

  // ── general UI chrome (host / companion / index) ──
  var UI = {
    en: {
      caseTitle: "Case: The Demon King of the Clockwork City",
      caseSub: "{count} societies join tonight's hunt",
      snakeOrder: "Turn order",
      turnOf: "{name}'s turn",
      investigate: "Investigate",
      investigateSub: "Trade intel with the syndicate",
      strike: "Send Hitman",
      strikeSub: "Take out the Demon King",
      recentLog: "Recent Events",
      newGame: "New Game",
      newGameConfirm: "Start a new game?",
      noEvents: "Nothing has happened yet\u2026",
      pickCancel: "Cancel",
      pickInvestigate: "Pick a tile to investigate \u2192",
      pickStrike: "Pick a tile to send the hitman \u2192",
      strikeModalTitle: "Send Hitman",
      strikeModalSub: "Sure about this? Choose the tile to send your hitman after the Demon King.<br>If every society agrees, you win. If anyone disagrees, the shot misses and you lose your turn.",
      strikeModalHint: "\u26A0 A missed shot ends your turn immediately.",
      soundToggle: "Sound",
      hitLabel: "A Lead!",
      hitSub: "This tile matches {name}'s intel",
      missLabel: "Dead End",
      missSub: "This tile does not match {name}'s intel",
      hitTip: "\uD83E\uDE78 A Lead: this tile matches this player's clue",
      missTip: "\u2716 No match: this tile contradicts this player's clue",
      strikeWinLabel: "Target Hit!",
      strikeWinSub: "The Demon King has been exposed",
      strikeFailLabel: "Shot Missed",
      strikeFailSub: "The hitman missed \u2014 {name} disagreed",
      winTitle: "Target Hit: the Demon King is dead",
      winSub: "Player {n} is the hero of the night",
      startNewGame: "Start New Game",
      reverseOrder: "Reversed Turn Order",
      reverseSub: "The same player goes again",
      loadFail: "Couldn't load maps.json. Open this over the web or Vercel, not by double-clicking the file.",
      logInvestigate: "Player {n} investigated {target} at {coord} \u2192",
      logStrikeWin: "Player {n} sent the hitman to {coord} \u2192 Target Hit!",
      logStrikeFail: "Player {n} sent the hitman to {coord} \u2192 Shot missed ({who} disagreed), turn ends",
      someone: "another society",
      terrain: "Terrain",
      structures: "Structures",
      // companion
      compIntelLabel: "Your Lead",
      compLikely: "Likely",
      compRuledOut: "Ruled out",
      compUnsure: "Unsure",
      compTerrain: "Terrain \u0026 Structures",
      compNotes: "Notes",
      compNotesPlaceholder: "Jot down what you've learned, e.g. Player 2 answered \u2716 at (3,4)\u2026",
      compClearMarks: "Clear all marks on the board",
      compRotateHint: "\u21BB Rotate to landscape for a bigger board",
      compFadeNote: "Faded tiles are ones your lead rules out \u2014 the board filters them automatically, leaving only what's still possible.",
      compInvalidLink: "Invalid link \u2014 please rescan the QR code from the host.",
      compLoadFail: "Couldn't load maps.json. Open this over the web or Vercel, not by opening the file directly.",
      mapNotFound: "Couldn't find map #{n}",
      playerNotFound: "Couldn't find this player in the map",
      loadingCompanion: "Opening your companion notebook\u2026",
      railLabel: "Rail Line",
      // index
      idxTitle: "The Dossier",
      idxSub: "3 to 5 players \u00b7 a hex deduction game",
      idxHostTitle: "Host",
      idxHostDesc: "The shared screen everyone watches. Runs the game and hands out leads.",
      idxCompanionTitle: "Companion",
      idxCompanionDesc: "Scan the QR from the board to get your own secret lead.",
      idxLabLink: "\uD83E\uDDEA Map-building Lab (for game masters)",
      idxRule: "The Demon Hunt",
      idxSubLine: "In an age of clockwork, gears never stop turning. The Demon King hides in the shadows.|Secret societies each hold one piece of the truth, racing to solve the puzzle.|Only one bullet will find the mark.",
      idxHostTitle2: "Open the Board",
      idxCompanionTitle2: "Companion Notebook",
      idxHostTag: "HOST \u00b7 Big Screen",
      idxCompanionTag: "COMPANION \u00b7 Mobile",
      idxFooterText: "The Dossier \u00b7 3 to 5 players",
      selKicker: "Secret Case Files \u00b7 Blood-Cog Society",
      selRule: "Assemble the hunting party",
      selQ: "How many hunters ride tonight?",
      modeOpen: "Open (easy)",
      modeHidden: "Hidden (challenge)",
      modeLabel: "Society reveal:",
      loading: "Loading map files\u2026",
      briefKicker: "Secret Case \u00b7 Prologue",
      briefGoBtn: "Distribute leads \u2192",
      qrKicker: "Distributing secret leads",
      qrSub: "Have each player scan with their companion (phone) to receive their lead",
      qrPrev: "\u2190 Previous",
      qrNext: "Next \u2192",
      turnOf2: "Turn:",
      secretSociety: "Secret Society",
      playerLabel: "Player",
      sealedIntel: "Lead sealed",
      holdsIntel: "Holds one secret lead",
      qrTitleFor: "Lead for Player {n}",
      qrGenFail: "Couldn't generate QR code",
      factionSealed: "(Society kept secret)",
      openInNewTab: "Open companion in a new tab (same-device test) \u2197",
      investigateModalTitle: "\uD83D\uDD75\uFE0F Investigate",
      investigateModalSub: "Choose a society to send the messenger bird to for a trade",
      sendingBird: "\uD83D\uDD4A\uFE0F The messenger bird sets off\u2026",
      sendingHitman: "\uD83D\uDD2B The hitman closes in\u2026",
    },
    th: {
      caseTitle: "คดี: ราชาปีศาจแห่งนครจักรกล",
      caseSub: "{count} สมาคมร่วมไล่ล่าในคืนนี้",
      snakeOrder: "ลำดับงูเลื้อย",
      turnOf: "ตาของ {name}",
      investigate: "ส่งสายสืบ",
      investigateSub: "แลกข่าวกับสมาคม",
      strike: "ส่งนักฆ่า",
      strikeSub: "สังหารราชาปีศาจ",
      recentLog: "บันทึกเหตุการณ์ล่าสุด",
      newGame: "เริ่มใหม่",
      newGameConfirm: "เริ่มเกมใหม่?",
      noEvents: "ยังไม่มีความเคลื่อนไหว\u2026",
      pickCancel: "ยกเลิก",
      pickInvestigate: "เลือกช่องบนกระดานเพื่อส่งสายสืบ \u2192",
      pickStrike: "เลือกช่องที่จะส่งนักฆ่า \u2192",
      strikeModalTitle: "ส่งนักฆ่า",
      strikeModalSub: "มั่นใจแล้วหรือ? เลือกช่องที่จะส่งนักฆ่าเข้าสังหารราชาปีศาจ<br>หากทุกสมาคมยืนยันตรงกัน = ชนะ \u00b7 หากมีผู้ใดค้าน = พลาดเป้า เสียเทิร์น",
      strikeModalHint: "\u26A0 การส่งนักฆ่าที่พลาดจะเสียตาเดินทันที",
      soundToggle: "เสียง",
      hitLabel: "มีร่องรอย",
      hitSub: "ช่องนี้เข้าได้กับเบาะแสของ {name}",
      missLabel: "ไร้ร่องรอย",
      missSub: "ช่องนี้ไม่ตรงเบาะแสของ {name}",
      hitTip: "🩸 มีร่องรอย: ช่องนี้เข้าได้กับเบาะแสของผู้เล่นคนนี้",
      missTip: "✖ ไม่ตรง: ช่องนี้ขัดกับเบาะแสของผู้เล่นคนนี้",
      strikeWinLabel: "กระสุนเข้าเป้า",
      strikeWinSub: "ราชาปีศาจถูกจัดการ",
      strikeFailLabel: "กระสุนผ่านเงาลวงตา",
      strikeFailSub: "นักฆ่าพลาดเป้า เพราะ{name}ไม่ยืนยัน",
      winTitle: "กระสุนเข้าเป้า ราชาปีศาจดับสูญ",
      winSub: "ผู้เล่น {n} คือผู้ชนะแห่งราตรี",
      startNewGame: "เริ่มเกมใหม่",
      reverseOrder: "ย้อนลำดับงูเลื้อย",
      reverseSub: "ผู้เล่นคนเดิมได้เล่นต่อ",
      loadFail: "โหลด maps.json ไม่ได้ ต้องเปิดผ่านเว็บหรือ Vercel ไม่ใช่ดับเบิลคลิกไฟล์",
      logInvestigate: "ผู้เล่น {n} ส่งสายสืบ {target} ที่ {coord} \u2192",
      logStrikeWin: "ผู้เล่น {n} ส่งนักฆ่าที่ {coord} \u2192 กระสุนเข้าเป้า!",
      logStrikeFail: "ผู้เล่น {n} ส่งนักฆ่าที่ {coord} \u2192 กระสุนผ่านเงาลวงตา ({who}ค้าน) จบเทิร์น",
      someone: "สมาคมหนึ่ง",
      terrain: "ภูมิประเทศ",
      structures: "สิ่งก่อสร้าง",
      compIntelLabel: "เบาะแสของคุณ",
      compLikely: "น่าจะใช่",
      compRuledOut: "ตัดออก",
      compUnsure: "สงสัย",
      compTerrain: "ภูมิประเทศ \u0026 สิ่งก่อสร้าง",
      compNotes: "บันทึกส่วนตัว",
      compNotesPlaceholder: "จดสิ่งที่สืบได้ เช่น ผู้เล่น 2 ตอบ \u2716 ที่ (3,4)\u2026",
      compClearMarks: "ล้างเครื่องหมายบนกระดานทั้งหมด",
      compRotateHint: "\u21BB พลิกจอเป็นแนวนอนเพื่อกระดานใหญ่ขึ้น",
      compFadeNote: "ช่องที่จางลงคือช่องที่เบาะแสของคุณตัดออกแล้ว ระบบกรองให้อัตโนมัติ เหลือเฉพาะช่องที่ยังเป็นไปได้",
      compInvalidLink: "ลิงก์ไม่ถูกต้อง กรุณาสแกน QR จากกระดาน (Host) อีกครั้ง",
      compLoadFail: "โหลด maps.json ไม่ได้ ต้องเปิดผ่านเว็บหรือ Vercel ไม่ใช่เปิดไฟล์ตรงๆ",
      mapNotFound: "ไม่พบแผนที่ #{n}",
      playerNotFound: "ไม่พบผู้เล่นคนนี้ในแผนที่",
      loadingCompanion: "กำลังเปิดสมุดสายลับ\u2026",
      railLabel: "รางรถไฟ",
      idxTitle: "The Dossier",
      idxSub: "เล่น 3 ถึง 5 คน \u00b7 เกมไขปริศนาบนกระดานหกเหลี่ยม",
      idxHostTitle: "Host",
      idxHostDesc: "จอกลางที่ทุกคนมองเห็น คุมเกมและกระจายเบาะแสให้ผู้เล่น",
      idxCompanionTitle: "Companion",
      idxCompanionDesc: "สแกน QR จากกระดานเพื่อรับเบาะแสลับประจำตัวคุณ",
      idxLabLink: "\uD83E\uDDEA ห้องแล็บสร้างแผนที่ (สำหรับผู้จัดเกม)",
      idxRule: "เกมไล่ล่าราชาปีศาจ",
      idxSubLine: "ในนครยุคจักรกลที่ฟันเฟืองหมุนไม่หยุด ราชาปีศาจแฝงกายในเงามืด|สมาคมลับต่างถือเบาะแสคนละชิ้น แข่งกันไขปริศนา|มีเพียงกระสุนเดียวเท่านั้นที่จะสังหารราชาปีศาจได้สำเร็จ",
      idxHostTitle2: "เปิดกระดาน",
      idxCompanionTitle2: "สมุดสายลับ",
      idxHostTag: "HOST \u00b7 จอใหญ่",
      idxCompanionTag: "COMPANION \u00b7 มือถือ",
      idxFooterText: "The Dossier \u00b7 เล่น 3 ถึง 5 คน",
      selKicker: "ห้องเก็บแฟ้มลับ \u00b7 ฟันเฟืองสีเลือด",
      selRule: "จัดตั้งคณะล่าปีศาจ",
      selQ: "ค่ำคืนนี้มีนักล่ากี่สมาคม?",
      modeOpen: "เปิด (ง่าย)",
      modeHidden: "ปิด (ท้าทาย)",
      modeLabel: "การเปิดเผยสมาคม:",
      loading: "กำลังโหลดแฟ้มแผนที่\u2026",
      briefKicker: "แฟ้มลับ \u00b7 บทนำ",
      briefGoBtn: "กระจายเบาะแส \u2192",
      qrKicker: "กระจายเบาะแสลับ",
      qrSub: "ให้ผู้เล่นสแกนด้วยสมุดสายลับ (มือถือ) เพื่อรับเบาะแสของตน",
      qrPrev: "\u2190 ก่อนหน้า",
      qrNext: "ถัดไป \u2192",
      turnOf2: "ตาของ",
      secretSociety: "สมาคมลับ",
      playerLabel: "ผู้เล่น",
      sealedIntel: "เบาะแสถูกปิดผนึก",
      holdsIntel: "ถือเบาะแสลับ 1 ชิ้น",
      qrTitleFor: "เบาะแสของผู้เล่น {n}",
      qrGenFail: "สร้าง QR ไม่ได้",
      factionSealed: "(สมาคมถูกปิดเป็นความลับ)",
      openInNewTab: "เปิดสมุดสายลับในแท็บใหม่ (ทดสอบเครื่องเดียว) \u2197",
      investigateModalTitle: "🕵️ ส่งสายสืบ",
      investigateModalSub: "เลือกสมาคมที่จะส่งนกสองหัวไปแลกข่าว",
      sendingBird: "🕊️ นกสองหัวนำสาส์นออกเดินทาง…",
      sendingHitman: "🔫 นักฆ่าพุ่งเข้าจู่โจม…",
    },
  };

  // ── language state ──
  var KEY = "dossier_lang";
  function getLang() {
    try { return localStorage.getItem(KEY) || "en"; } catch (e) { return "en"; }
  }
  function setLang(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  // t(key, vars): look up UI[lang][key], interpolate {vars}
  function t(key, vars) {
    var lang = getLang();
    var s = (UI[lang] && UI[lang][key] != null) ? UI[lang][key] : (UI.en[key] || key);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split("{" + k + "}").join(vars[k]);
      });
    }
    return s;
  }

  global.I18N = {
    getLang: getLang, setLang: setLang, t: t,
    UI: UI, FACTION_I18N: FACTION_I18N, EPILOGUE: EPILOGUE, EPILOGUE_HIDDEN: EPILOGUE_HIDDEN,
    STORY_OPEN: STORY_OPEN, STORY_CLOSE: STORY_CLOSE,
    TERRAIN_NAME: TERRAIN_NAME, FEATURE_NAME: FEATURE_NAME,
    CLUE_TPL: CLUE_TPL, renderClueLabel: renderClueLabel,
  };
})(window);
