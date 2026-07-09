# THE DOSSIER · เอกสารส่งต่องาน UI/UX/Animation
> Handoff สำหรับ model/ทีมถัดไป · อัปเดตล่าสุด: มิ.ย. 2026
> ภาษาหลักของเกม: ไทย · ธีม: Industrial/Steampunk dossier (กระดาษเก่า + ทองเหลือง + เลือดหมู)

---

## 1. ภาพรวมโปรเจกต์

**The Dossier** = บอร์ดเกม deduction แนว Cryptid เล่น 3-5 คน ผู้เล่นเป็น Fixer จากสมาคมลับ แข่งกันหาช่องที่ราชาปีศาจซ่อนอยู่บน hex grid 13×10 แต่ละคนถือเบาะแสเชิงพื้นที่ (intel) คนละ 1 ใบ ทุกใบจริงพร้อมกันและตัดกันที่ช่องเดียว

**สถาปัตยกรรม (LOCKED ห้ามเปลี่ยน):**
```
index.html      หน้าแรก เลือก host/companion (+ลิงก์ lab)
host.html       จอกลาง (iPad/จอใหญ่) ถือ state ทั้งหมด ตัดสินทุก action
companion.html  มือถือผู้เล่นรายคน = สมุดโน้ตอัจฉริยะ (รู้แค่ intel ตัวเอง)
lab.html        เครื่องมือผู้จัดเกม สร้าง/ตรวจ/export แผนที่ (build จาก puzzle-lab.jsx)
maps.json       preset 16 ชุด (flat array) ทั้ง host+companion fetch ไฟล์เดียวกัน
```
- สื่อสารทางเดียว: host แสดง QR = URL `companion.html?map=<index>&p=<playerIdx>&mode=<open|hidden>` companion เปิดแล้ว fetch maps.json เอง ไม่มี sync ระหว่างเกม
- Deploy บน Vercel วางทั้ง 5 ไฟล์โฟลเดอร์เดียว
- **DEMO MODE:** host+companion มี `window.__DEMO_MAPS__` ฝังใน `<script>` บล็อกแรกหลัง `<body>` (comment `===== DEMO MAPS =====`) เพื่อเปิด file:// ได้ ตอน deploy จริงลบบล็อกนี้ทิ้ง โค้ดจะ fallback ไป fetch เอง **ห้ามแตะ logic การโหลดนี้**

**กติกาเกม (LOCKED):** snake order (1→2→3→3→2→1) · 1 action/เทิร์น · Investigate=เลือกเป้า+ช่อง host เช็ค intel ทั้งเป้าและผู้ถาม ลง marker สาธารณะทั้งคู่ · Strike=เลือกช่อง เช็คทุกคน all-YES=ชนะ มี NO=เสียเทิร์น

**ศัพท์ธีม (ใช้เสมอ ห้ามพูดตรงๆ):** ส่งสายสืบ 🕵️ / ลงดาบ 🗡️ / ต้องตามรอยนี้ 🩸 / รอยลวง ทางตัน ✖ / ดาบปักเป้า ราชาปีศาจดับสูญ / เพียงเงาลวงตา

---

## 2. Design System (บังคับใช้)

| token | ค่า |
|---|---|
| --paper / --paper2 | #e9e1cd / #e2d8bf |
| --ink / --ink2 / --ink3 | #241c12 / #5a4c38 / #8a7a62 |
| --rule | #c4b596 |
| --red (เลือดหมู) | #9a2a1e |
| --sepia (ทองเหลือง) | #8a6a3a |
| สีผู้เล่น P0-P4 | #9a2a1e #8a6a28 #3a5a72 #6a4a7a #3a6a3a |
| ฟอนต์ | Georgia / 'Playfair Display' (serif = ธีม manuscript ถูกต้องแล้ว) |
| เงา | ห้าม rgba(0,0,0) ใช้ warm ink rgba(36,28,18,x) |
| viewport | ใช้ 100dvh เท่านั้น (ห้าม 100vh) |

**กฎ copy (จาก design-taste-frontend skill ที่ audit ผ่านแล้ว):**
- **ห้าม em-dash (-) และ en-dash (–) เด็ดขาด** ทุกไฟล์ตอนนี้ = 0 ห้ามใส่กลับ
- middle-dot (·) สูงสุด 1 ต่อบรรทัดข้อความ
- ภาษาไทยเป็นหลัก อังกฤษเฉพาะศัพท์เทคนิค

**สีภูมิประเทศ (LOCKED):** factory #6b4a2e · smog #cdd2d6 · cemetery #a8d8a8 · slums #e8b4c4 · harbor #2a4a78

---

## 3. Build Pipeline (สำคัญมาก)

ทุกอย่างอยู่ที่ `/home/claude/build/` (ถ้า environment ใหม่ต้อง `npm install react react-dom @babel/core @babel/preset-env @babel/preset-react qrcode-generator jsdom` ก่อน)

- **host/companion = vanilla JS ฝังใน HTML โดยตรง** แก้ที่ `/mnt/user-data/outputs/host.html`, `companion.html` ตรงๆ ได้เลย (source เก่าใน build/ คือ host-game.js, companion.js แต่ **ล้าสมัยแล้ว อย่าใช้ re-inject** เพราะแก้ตรง html มาหลายรอบ)
- **lab.html build จาก `/mnt/user-data/outputs/puzzle-lab.jsx`** ผ่าน `node transform.js` (Babel classic runtime) แล้ว python รวม React UMD → เขียนทับ lab.html · แก้ Lab ต้องแก้ที่ jsx แล้ว rebuild เสมอ
- **ทดสอบทุกครั้งหลังแก้:** (1) แตก `<script>` ทุกบล็อกออกมา `node -c` (2) `node testcomp.js` (jsdom โหลด companion?map=0&p=0 เช็ค loading hidden / app shown / crestName ขึ้น)

---

## 4. บั๊กที่เคยเจอ (ห้ามทำซ้ำ - นี่คือ pattern ที่พังมาแล้วจริง)

1. **keyframe ที่มี opacity + `both` จะล็อกค่า opacity ทับ inline opacity ของ element** → companion เคยพังเพราะ tileDrop มี opacity:0→1 ทับช่องเทา 0.18 · กฎ: keyframe บนกระดาน **animate เฉพาะ transform** ปล่อย opacity ให้ค่า inline คุม
2. **`G.lastMarkCell` ต้องเคลียร์เป็น null ก่อน renderBoard ทุกครั้งที่ไม่ใช่การลงหมากจริง** (เริ่ม action, เปลี่ยนเทิร์น) ไม่งั้น marker เก่าเล่น drop animation ซ้ำ = กระพริบ · ตอนนี้เคลียร์ 3 จุด: resolveInvestigate ก่อนบิน, resolveStrike ก่อนดาบ, nextTurn
3. **TDZ:** ตัวแปร state (`let CELLS, MYCLUE, ...`) ต้องประกาศ **เหนือ** บล็อกโหลด demo-maps เพราะ demo path รัน sync
4. SVG animation ต้องใส่ `transform-box:fill-box;transform-origin:...` เสมอ ไม่งั้นหมุน/scale ผิดจุด
5. รางรถไฟต้องวาด **หลัง** hex (เก็บใน railSvg string แล้ว append) สไตล์ = เส้นทึบ #3a2c1a + เส้นประ #c4b596 ทับ (ผู้ใช้เลือกแบบเส้นประแล้ว ห้ามเปลี่ยนเป็น sleeper dots)

---

## 5. Animation Inventory ปัจจุบัน

**Host มีแล้ว:** tile cascade เปิดกระดาน (tileDrop คลื่นทแยง) · นก 🕊️ บินโค้ง+กระพือไปช่อง (flyToken helper, quadratic arc, rAF) · ดาบ 🗡️ ดิ่งจากบน · marker หล่นมีเงา (markerDrop+landShadow) · impact ring · toast กลางจอ (announce) · turn banner เลื่อนจากบน · pick mode (กรอบ pulse + ribbon มีปุ่มยกเลิก) · ปุ่ม armed state · fog drift บนกระดาน · gaslight flicker ชื่อเกม · การ์ดสมาคมแจกแบบไพ่ (cardDeal) · shockwave 3 วงตอนชนะ · demonThrob · screen transition (screenIn) · hover ช่องยกตัว scale 1.08

**Companion มีแล้ว:** tile cascade (transform-only) · markDrop · sheetUp (bottom sheet) + ปัดลงปิด + grip · intelGlow เต้น · fade stagger · `.cell:active` opacity

**Lab มีแล้ว:** inkBleed masthead · fadeUpSoft stagger 3 คอลัมน์ · slideFade codex rows · stampIn2 badge · popIn popup · typewriter ข่าวด่วน

**Dead code ใน host (ลบได้เลย ประกาศแล้วไม่ได้ใช้):** `birdFlap` `cellPress` `daggerFall` `glowPulse` `markerPop`

**ทุกไฟล์รองรับ `prefers-reduced-motion` แล้ว** (flyToken เรียก callback ทันทีเมื่อ reduce) ต้องคงไว้กับของใหม่ทุกชิ้น

---

## 6. รีวิว: ช่องว่างที่เหลือ (เรียงตามผลต่อความรู้สึกบอร์ดเกม)

> ✅ อัปเดต: backlog ด้านล่างทำครบทุกข้อแล้ว (รอบ Fable) รายละเอียดสิ่งที่ทำจริงอยู่ท้ายหัวข้อ

### 🔴 P1 ผลกระทบสูง - ✅ เสร็จ
1. ✅ **เสียง WebAudio** โมดูล `SFX` สังเคราะห์ในโค้ด (ไม่มีไฟล์ external): place(ไม้เคาะ) wing(ปีก) clash(โลหะ) paper(กระดาษ) tick win fail stamp · ปุ่ม toggle 🔇/🔊 มุมขวาล่าง default ปิด · unlock ctx ด้วย pointerdown แรก
2. ✅ **Companion idle + haptic** navigator.vibrate(9) ตอนแตะ mark · crestBreath หายใจบนไอคอนสมาคม · intelGlow เดิม
3. ✅ **ตราครั่งคั่น phase** `waxTransition(glyph, cb)` overlay ตราครั่งประทับ 0.9s คั่น briefing→QR (📜) และ QR→กระดาน (🗺️) + เสียง stamp

### 🟡 P2 - ✅ เสร็จ
4. ✅ **Log highlight** entry ล่าสุด class `.fresh` เรืองทอง 2s แล้วจาง (logFlash)
5. ✅ **Snake arrow + reverse banner** tbSnake แสดง ⇢/⇠ ตามทิศ · ตอนกลับทิศ announce "ย้อนลำดับงูเลื้อย"
6. ✅ **Epilogue + confetti** const EPILOGUE 5 สมาคม แสดงใต้ result · spawnEmbers() เถ้าถ่านทอง/แดง 34 ชิ้นหล่น (emberFall)
7. ✅ **Lab cascade** remount board ด้วย key={genId} (เพิ่มตอน generate เท่านั้น ไม่ใช่ reClue) · labTile transform-only (กันชน dim opacity)

### 🟢 P3 - ✅ เสร็จ
8. ✅ ลบ dead keyframes: birdFlap cellPress daggerFall glowPulse markerPop
9. ✅ ปุ่ม side-action hover: 🕵️ เอียง -12deg, 🗡️ ยกขึ้น -6px
10. ✅ Companion first-open: highlightPossibleOnce() outline ทองรอบช่องที่เป็นไปได้ 1 รอบ (possibleHint)

### รอบถัดไป (ยังไม่ทำ - ไอเดียต่อยอด)
- เสียงใน companion (ตอนนี้มีแค่ host + haptic)
- particle ควันตอนแพ้/ลงดาบพลาด
- นก 2 หัวเป็น sprite จริง (ตอนนี้ใช้ 🕊️)
- hand-tune 16 briefing ให้ต่างกันมากขึ้น (ตอนนี้ประกอบจาก template)


---

## 7. Definition of Done ต่อชิ้นงาน

- [ ] แก้ในไฟล์ `/mnt/user-data/outputs/` โดยตรง (Lab แก้ที่ jsx + rebuild)
- [ ] `node -c` ผ่านทุก script block ทุกไฟล์ที่แตะ
- [ ] `node testcomp.js` ผ่าน (companion boots)
- [ ] ไม่มี em-dash/en-dash เพิ่ม (grep = 0)
- [ ] keyframe ใหม่บนกระดาน = transform-only
- [ ] รองรับ prefers-reduced-motion
- [ ] เงาใหม่ใช้ rgba(36,28,18,x)
- [ ] ทดสอบ demo mode: เปิด host.html แบบ file:// เล่นจบ 1 เกม (ใช้ลิงก์ใต้ QR เปิด companion แท็บใหม่)
- [ ] present_files ส่ง 5 ไฟล์ deploy: index, host, companion, lab, maps.json

## 8. สิ่งที่ห้ามทำ
- ห้ามเปลี่ยน architecture, กติกาเกม, สี terrain, สไตล์รางเส้นประ, ศัพท์ธีม
- ห้ามลบ/แก้บล็อก DEMO MAPS และ fallback fetch
- ห้ามใช้ไลบรารี external เพิ่ม (ทุกไฟล์ standalone offline ได้)
- ห้ามใช้ localStorage ใน host (companion ใช้อยู่แล้วสำหรับ marks/notes อันนี้คงไว้)
- อย่า re-inject จาก build/host-game.js หรือ build/companion.js (ล้าสมัย)
