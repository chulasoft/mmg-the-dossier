# THE DOSSIER · แผนพัฒนา 3D (แนวทาง B · Three.js)
> เอกสารสั่งงานทีม model · อ่านคู่กับ HANDOFF.md (กฎโปรเจกต์/บั๊ก pattern/DoD เดิมบังคับใช้ทั้งหมด)
> ภาพเป้าหมายที่ผู้ใช้อนุมัติ: `proto-3d.html` · ของจริงต้องรายละเอียดดีกว่า + มี hover ราย hex
> แผนนี้แทนที่แผน 2.5D ฉบับก่อน (ยกเลิกแล้ว)

---

## 0. การตัดสินใจ + ข้อพิสูจน์สำคัญ

ยกกระดานทั้ง 3 แอป (host, companion, lab) เป็น **WebGL จริงด้วย Three.js r160** โดย **ไม่เสีย offline**:

**พิสูจน์แล้วใน build env:** `esbuild` bundle three core เป็น IIFE ที่ set `window.THREE` ได้ ขนาด **649KB** ฝังใน `<script>` แบบเดียวกับที่ฝัง React ใน lab.html · คำสั่งที่ใช้จริง (รันจาก `/home/claude/build`):
```bash
npm install three@0.160.0 esbuild
echo 'import * as THREE from "three"; window.THREE = THREE;' > three-entry.js
npx esbuild three-entry.js --bundle --minify --format=iife --outfile=three.bundle.js
# ได้ three.bundle.js (649KB) → python inject เข้า html เหมือน qrlib/React
```
- **ไม่ใช้ OrbitControls** (ตัด dependency) เขียน camera rig เองตามสเปก §3
- ขนาดไฟล์หลัง embed: host ~950KB, companion ~850KB, lab ~880KB รวม deploy ~3MB รับได้ทั้ง Vercel และ file://
- three.bundle.js สร้างครั้งเดียวเก็บไว้ที่ `/home/claude/build/three.bundle.js` ใช้ฉีดทุกไฟล์

**หลักการกั้นขอบเขต (สำคัญที่สุดของแผนนี้):**
3D แทนที่ **เฉพาะกระดาน** (สิ่งที่เคยเป็น SVG ใน boardArea/mapWrap/HexBoard) · UI chrome ทั้งหมดคง DOM เดิม: topbar, ปุ่ม side-action, log, modal, toast/announce, turn banner, wax seal, QR, bottom sheet, เสียง SFX, briefing ทุกอย่างไม่แตะ · logic เกม/evalClue/maps.json/QR flow ห้ามแตะตาม HANDOFF

**Fallback บังคับ:** เก็บ renderBoard แบบ SVG เดิมไว้หลัง flag · ตอน boot ลอง `new THREE.WebGLRenderer()` ใน try/catch ถ้าพัง (WebGL ไม่มี/มือถือเก่า) ใช้เส้นทาง SVG เดิมทั้งหมด เกมต้องเล่นได้เสมอ

---

## 1. สถาปัตยกรรมโมดูล Board3D (ฝังใน script เกมของแต่ละไฟล์)

สร้าง object `B3D` มี API แคบๆ ให้โค้ดเกมเดิมเรียก โดย mapping จากฟังก์ชันเดิม:

| ของเดิม (SVG) | ใหม่ (B3D API) |
|---|---|
| renderBoard(opts) | `B3D.build(preset)` ครั้งเดียว + `B3D.setMarks(G.marks, lastMarkCell)` / `B3D.setPickMode(on, onPick)` / `B3D.reveal(answer)` |
| flashCell / impactAt | `B3D.impact(cell, color)` วง ring mesh ขยายบนผิว |
| flyToken นก/ดาบ | `B3D.flyBird(fromEdge, cell, cb)` / `B3D.dropDagger(cell, cb)` |
| shockwave ชนะ | `B3D.winFx(cell)` |
| tile cascade | อยู่ใน build(): ช่องหล่นจากฟ้าคลื่นทแยง (tween ตำแหน่ง y ไม่ใช่ CSS) |

ภายใน B3D: scene, camera, renderer(alpha:true พื้นหลังโปร่งให้เห็นกระดาษเดิม), lights ตาม proto (key ทอง 0xffe8c4 / ambient ฟ้า / rim แดง 0x9a2a1e), raycaster, tween helper เล็กๆ เขียนเอง (lerp + easing ผ่าน rAF ห้ามใส่ tween library)

**พิกัด:** ใช้ hexWorld จาก proto (pointy-top odd-r, SIZE=1) · `hposFlat/hdist/toCube` เดิมเก็บไว้ใช้กับ logic ห้ามลบ · cell↔mesh ผูกผ่าน `mesh.userData.cell`

## 2. สเปกภาพ "ดีกว่า prototype"

1. **Tile**: ExtrudeGeometry hex + bevel เดิม แต่เพิ่ม 2 อย่าง: ผิวบนมี vertex-less shading จากไฟ (มีแล้วโดย MeshStandard) + **ขอบหมึก**: EdgesGeometry เส้นบาง 0x5a4632 เฉพาะขอบบน ให้คงลายเส้น dossier
2. **ท่าเรือ (harbor)**: ผิวต่ำกว่าช่องอื่น 35% + material `metalness:0.3 roughness:0.25` ให้วาวแบบน้ำ + แผ่นระนาบบางสีเดียวกัน opacity 0.5 ซ้อนขยับ y เล็กน้อย (คลื่นหายใจช้า)
3. **อาคาร = โมเดลประกอบจาก primitive** (แทนเสาเดียวใน proto):
   - หอนาฬิกา 🕰: กล่องสูง + ยอดพีระมิด + วงแหวนหน้าปัด
   - โรงไฟฟ้า ⚡: กล่องอ้วน + ปล่องทรงกระบอก 2 ต้น (ต้นหนึ่งสูงกว่า)
   - สถานี 🚉: กล่องเตี้ย + หลังคาปริซึมสามเหลี่ยม
   - สีตาม FEATURE เดิม · ทุกชิ้น castShadow · **บวก sprite emoji ลอยเหนือยอด** (canvas texture) เพื่อคงภาษาไอคอนของเกมให้ผู้เล่นจำได้
4. **ราง**: แคปซูล/cylinder บางสีเข้มพาดเชื่อมช่อง rail ที่ hdist=1 (แบบ proto) + หมอนราง (กล่องจิ๋วขวางทุกครึ่ง SIZE) แทนความรู้สึกเส้นประเดิม
5. **หมาก marker**: ดิสก์สีผู้เล่น (PCOLOR) ขอบสว่าง 0xfff4d8 · แบบ miss = ดิสก์เดียวกันแต่มีกากบาทนูน (กล่องแบน 2 ชิ้นไขว้) สีเดิม · เรียงวน 6 ทิศรอบ center เหมือน logic เดิม
6. **ปีศาจ**: octahedron แดง emissive เดิม + particle ควันดำจางๆ 5-6 ชิ้นวนรอบตอน reveal
7. **ฐานกระดาน**: แผ่นไม้เข้ม (มีใน proto) + ShadowMaterial พื้นรับเงา · เพิ่มขอบทองเหลืองบางรอบฐาน (กล่องแบนสี --sepia)
8. **หมอก**: เลิกใช้ CSS fogDrift บน boardArea → ใช้ `scene.fog = new THREE.Fog(0xe4dabf, 30, 90)` ให้ขอบกระดานจางเข้าธีมกระดาษ

## 3. กล้อง + Hover ราย hex (หัวใจที่ผู้ใช้ขอ)

**Camera rig เขียนเอง (~30 บรรทัด):** มุมตั้งต้น polar 52° ระยะ 34 มองศูนย์กลาง · ลาก = หมุนรอบแกน Y ได้ ±180° + ปรับ polar 25–70° · scroll/pinch = ซูม 16–60 · damping 0.08 · **ไม่มี auto-rotate ในเกมจริง** (มีเฉพาะตอน win splash หมุนช้าโชว์) · companion: rig เดียวกันแต่ล็อก polar เดี่ยว อนุญาตหมุน Y ±30° พอ

**Hover (host/lab, เมาส์):** raycast ทุก pointermove (throttle ผ่าน rAF flag) → tile ใต้เมาส์:
- ยกขึ้น tween `position.y += 0.22` (easing out, 120ms) ช่องเดิมคืนลง
- `material.emissive` เป็นสีผิวจางๆ (emissiveIntensity 0.18) ให้สว่างขึ้น
- ของบนช่อง (อาคาร/หมาก/ราง segment ที่ anchor ช่องนี้) group เดียวกัน ยกตาม → ทำได้โดยให้ทุกช่องเป็น `THREE.Group` ต่อ tile ตั้งแต่ build
- โหมด picking: hover เพิ่ม ring ทองบนผิว + cursor pointer · คลิก = raycast เดียวกัน ได้ cell จาก userData → เรียก onPick เดิม (แม่นกว่า SVG เดิมด้วยซ้ำ)
**Touch (companion):** ไม่มี hover → แตะ = raycast เลือก/mark ทันที + tile ยุบลง 0.1 แวบเดียว (กดลงไม่ใช่ยก) + haptic เดิม
**reduced-motion:** ปิด tween ยก (สลับ emissive อย่างเดียว) ปิดคลื่นน้ำ ปิด cascade

## 4. ย้าย animation เดิม (mapping ครบ)

| เดิม | ใหม่ |
|---|---|
| นก 🕊️ SVG โค้ง+กระพือ | sprite emoji (canvas texture) วิ่งตาม `QuadraticBezierCurve3` จากขอบกระดานสูง y=4 ลงช่องเป้า · กระพือ = scale y sin ระหว่างทาง · เสียง wing เดิม |
| ดาบ 🗡️ ดิ่ง | mesh ดาบง่ายๆ (กล่องใบ+กระบอกด้าม) หรือ sprite ดิ่งจาก y=8 ease-in กระแทก → camera shake (สั่น position กล้อง 300ms แทน CSS shake) + `B3D.impact` |
| markerDrop+เงา | หมากเกิดที่ y+1.2 ตกลง bounce เล็ก (tween 2 จังหวะ) · เงาจริงจาก shadowMap ไม่ต้องวาด ellipse เอง |
| impact ring | TorusGeometry แบนขยาย+จาง บนผิวช่อง |
| shockwave ชนะ | ring 3 วงแบบเดียวกัน + demon โผล่: scale 0→1 overshoot + ควันวน + จอ DOM splash เดิมตามหลัง (splash/ember/epilogue คง DOM) |
| tile cascade | tween y จาก +6 ตกคลื่นทแยง delay (col+row)*28ms ตอน build |
| companion fade (_possible) | ช่องที่ตัดออก: material.transparent=true opacity 0.18 ทั้ง group + desaturate สี (lerp เข้าเทา 60%) · rail/อาคารบนช่องนั้นจางตาม |
| teaching pulse | ช่องที่เป็นไปได้: emissive ทองหายใจ 1 รอบ 1.6s แล้วดับ |
| lab hover-clue dim | เหมือน companion fade แต่ opacity 0.25 และ toggle ตาม hoverClue · ช่อง highlight ยก 0.12 ค้าง |

## 5. Performance & ความถูกต้อง (บังคับ)

- 130 tile-group + อาคาร ~10 + หมาก ≤30: draw call รวม <300 รับได้ ไม่ต้อง InstancedMesh
- `renderer.setPixelRatio(min(devicePixelRatio,2))` host · **companion cap 1.5 + ปิด shadowMap + antialias:false** (ประหยัดแบต)
- **Render-on-demand ใน companion**: ไม่รัน loop ตลอด วาดเฉพาะเมื่อมี interaction/tween ค้าง (`invalidate()` pattern) · host รัน loop ปกติ (มี idle น้ำ/หมอก)
- `document.hidden` → หยุด loop ทั้งคู่
- rebuild board (เริ่มเกมใหม่) ต้อง `geometry.dispose()/material.dispose()` ของเก่าทั้งหมด กัน memory leak
- canvas ใส่ใน boardArea/mapWrap เดิม ขนาดตาม container (ResizeObserver) ทุกแอปยังจบหน้าเดียวไม่ scroll

## 6. ลำดับงาน 5 เฟส

1. **Infra**: สร้าง three.bundle.js (คำสั่ง §0) · เขียน B3D core (scene/camera rig/raycast/tween helper) + fallback flag · ฉีดเข้า host
2. **Host เต็มเกม**: build board ตามสเปกภาพ §2 → hover/pick §3 → ย้าย animation §4 → เล่นจบเกมจริงบน file:// (สืบหลายครั้ง, ดาบพลาด, ดาบชนะ) + เทส fallback โดย force throw
3. **Companion**: โปรไฟล์เบา §5 + fade/teaching + แตะ mark ผ่าน raycast · เทส testcomp.js (หมายเหตุ: jsdom ไม่มี WebGL → ต้องยืนยันว่า fallback SVG ทำงานใน jsdom = ได้เทส fallback ฟรีไปด้วย) + เทสมือถือจริงแนวตั้ง/นอน
4. **Lab**: HexBoard React → component ครอบ canvas เรียก B3D เดียวกัน (ฝัง bundle ใน lab wrapper ตอน build) · hover-clue dim + reveal + cascade ตอน generate
5. **เก็บงาน**: ลบ proto 2 ไฟล์ออกจากชุด deploy · อัปเดต HANDOFF (render=3D, ขนาดไฟล์ใหม่, บั๊ก pattern ใหม่ที่เจอ) · ส่ง 5 ไฟล์ deploy + HANDOFF

## 7. DoD เพิ่มเติมเฉพาะงานนี้ (นอกจาก HANDOFF ข้อ 7 เดิม)

- [ ] raycast เลือกช่องแม่น 100% รวม 4 ช่องมุม และหลังหมุนกล้องแล้ว
- [ ] hover ยก tile แล้วของบนช่องยกตาม ไม่มีชิ้นลอยค้าง
- [ ] fallback SVG เล่นจบเกมได้เมื่อ WebGL ใช้ไม่ได้ (บังคับ throw ทดสอบ)
- [ ] jsdom testcomp ผ่าน (พิสูจน์ fallback companion)
- [ ] เริ่มเกมใหม่ 5 รอบติด ไม่มี memory โต (ดู performance.memory คร่าวๆ)
- [ ] companion ไม่ render ตอนไม่มี interaction (render-on-demand ทำงานจริง)
- [ ] marker เดิมนิ่งตอนเริ่ม action ใหม่ (regression lastMarkCell เดิม แต่ในโลก 3D = ไม่ re-tween)
- [ ] ทุกไฟล์เปิด file:// ได้ (offline คงอยู่เพราะ bundle ฝังแล้ว)
- [ ] em-dash = 0 / เงา DOM ใหม่ warm-tint / reduced-motion ครบ ตามเดิม

## 8. ห้ามทำ (เพิ่มจาก HANDOFF ข้อ 8)

- ห้ามโหลด three จาก CDN ใน production (ต้องฝัง bundle เท่านั้น)
- ห้ามเปลี่ยน UI chrome เป็น 3D (เฉพาะกระดาน)
- ห้ามใส่ physics/tween library เพิ่ม (เขียน lerp เอง)
- ห้ามลบโค้ด SVG render เดิม (คือ fallback)
- companion ห้ามเปิด shadowMap/loop ตลอดเวลา (แบตมือถือ)
