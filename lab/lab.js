/*
 * The Lab — a procedural, stylised model of Vishal's 10×10 ft room.
 * Units are metres. +x = towards the balcony (right wall), -z = desk wall (back),
 * +z = sofa side. The left and front walls are cut away, diorama style.
 *
 * Every object is built from primitives so the scene loads instantly; when
 * real photos / models arrive, each build*() function can be swapped for a
 * GLTF load without touching the interaction code.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";

const P = window.PROFILE || {};
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ACCENT = 0x3ee6c1, AMBER = 0xffb547, VIOLET = 0x9d8cff;

/* ───────────────────────── renderer / scene ───────────────────────── */
const canvas = $("#c");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  document.body.insertAdjacentHTML("beforeend", '<div class="fallback">Your browser couldn\'t start WebGL, so the 3D lab can\'t load. <a href="../">Back to the main site →</a></div>');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.35;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI * 0.49;
controls.enablePan = false;

/* deterministic random so the room looks the same on every visit */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (a) => a[Math.floor(rnd() * a.length)];

/* ───────────────────────── helpers ───────────────────────── */
const matCache = new Map();
function M(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.75, metalness: o.m ?? 0, flatShading: !!o.flat, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.op, opacity: o.op ?? 1, depthWrite: o.op ? false : true, side: o.ds ? THREE.DoubleSide : THREE.FrontSide }));
  }
  return matCache.get(key);
}
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = !mat.transparent;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const box = (w, h, d, mat, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
const cyl = (rt, rb, h, mat, x, y, z, p, seg = 20) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
const group = (x = 0, y = 0, z = 0, parent = scene) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); draw && draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { canvas: c, ctx, tex: t };
}

/* ───────────────────────── room shell ───────────────────────── */
const R = 1.524;          // half of 10 ft
const H = 2.6;            // wall height
const DESK_Y = 0.76;      // desk top surface
const animators = [];     // per-frame callbacks (t, dt)

// floor with planks
const floorTex = canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = "#c39a6b"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 3; j++) {
      const off = (i % 2) * 85 + j * 170;
      c.fillStyle = `hsl(30, ${32 + rnd() * 10}%, ${55 + rnd() * 8}%)`;
      c.fillRect(off % w, i * 64 + 1, 168, 62);
    }
    c.fillStyle = "rgba(60,35,15,.35)"; c.fillRect(0, i * 64, w, 2);
  }
}).tex;
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(2, 2);
const floor = box(2 * R + 0.1, 0.14, 2 * R + 0.1, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 }), 0, -0.07, 0, scene);
floor.castShadow = false;

const wallMat = M(0xece6da, { r: 0.95 });
const wallEdge = M(0xd6cdbd, { r: 0.95 });
// back wall (desk wall)
box(2 * R + 0.1, H, 0.1, wallMat, 0, H / 2, -R - 0.05, scene);
// right wall with the large door-cum-window opening onto the balcony
const OPEN_Z0 = -0.95, OPEN_Z1 = 0.95, OPEN_H = 2.2;
box(0.1, H, OPEN_Z0 + R + 0.1, wallMat, R + 0.05, H / 2, (-R - 0.1 + OPEN_Z0) / 2, scene);
box(0.1, H, R + 0.05 - OPEN_Z1, wallMat, R + 0.05, H / 2, (OPEN_Z1 + R + 0.05) / 2, scene);
box(0.1, H - OPEN_H, OPEN_Z1 - OPEN_Z0, wallMat, R + 0.05, (H + OPEN_H) / 2, 0, scene);
// cut-away stubs on the left and front walls, diorama style
box(0.1, 0.16, 2 * R + 0.1, wallEdge, -R - 0.05, 0.08, 0, scene);
box(2 * R + 0.2, 0.16, 0.1, wallEdge, 0.05, 0.08, R + 0.05, scene);
// skirting
box(2 * R, 0.07, 0.02, M(0xffffff), 0, 0.035, -R + 0.01, scene);

// rug under the chair
mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.012, 48), M(0x4f7d78, { r: 1 }), -0.05, 0.006, -0.35, scene).castShadow = false;

/* ───────────────────────── plants (low-poly) ───────────────────────── */
const swayers = [];
function pot(parent, r, h, color, opts = {}) {
  const g = group(0, 0, 0, parent);
  cyl(r, r * 0.78, h, M(color, { r: opts.glossy ? 0.25 : 0.85 }), 0, h / 2, 0, g, 24);
  cyl(r * 0.92, r * 0.92, 0.008, M(0x3b2a1e, { r: 1 }), 0, h - 0.006, 0, g, 24);
  if (opts.rim) cyl(r * 1.04, r * 1.04, 0.015, M(opts.rim, { r: 0.3 }), 0, h - 0.008, 0, g, 24);
  return g;
}
function leafy(parent, x, y, z, s = 1, potColor = 0xd9d2c3, leaf = 0x3f8f4a) {
  const g = group(x, y, z, parent);
  pot(g, 0.06 * s, 0.09 * s, potColor);
  const foliage = group(0, 0.09 * s, 0, g);
  const geo = new THREE.IcosahedronGeometry(0.05 * s, 0);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, rr = 0.03 * s + rnd() * 0.03 * s;
    const m = mesh(geo, M(i % 3 ? leaf : 0x5fae5a, { flat: true }), Math.cos(a) * rr, 0.04 * s + rnd() * 0.07 * s, Math.sin(a) * rr, foliage);
    m.scale.set(1, 0.55 + rnd() * 0.5, 0.7); m.rotation.set(rnd(), a, rnd() * 0.6);
  }
  swayers.push({ o: foliage, ph: rnd() * 6, amp: 0.04 });
  return g;
}
function snake(parent, x, y, z, s = 1) {
  const g = group(x, y, z, parent);
  pot(g, 0.055 * s, 0.1 * s, 0x2f3437);
  const f = group(0, 0.1 * s, 0, g);
  for (let i = 0; i < 6; i++) {
    const hh = (0.16 + rnd() * 0.14) * s;
    const m = mesh(new THREE.ConeGeometry(0.018 * s, hh, 4), M(i % 2 ? 0x2e6b3e : 0x4c8a3c, { flat: true }), (rnd() - 0.5) * 0.06 * s, hh / 2, (rnd() - 0.5) * 0.06 * s, f);
    m.rotation.set((rnd() - 0.5) * 0.3, rnd() * 3, (rnd() - 0.5) * 0.3); m.scale.z = 0.35;
  }
  swayers.push({ o: f, ph: rnd() * 6, amp: 0.02 });
  return g;
}
function cactus(parent, x, y, z) {
  const g = group(x, y, z, parent);
  pot(g, 0.035, 0.06, 0xc96f4a);
  mesh(new THREE.CapsuleGeometry(0.02, 0.06, 4, 8), M(0x4e8d4f, { flat: true }), 0, 0.11, 0, g);
  const arm = mesh(new THREE.CapsuleGeometry(0.011, 0.025, 4, 6), M(0x4e8d4f, { flat: true }), 0.025, 0.12, 0, g); arm.rotation.z = -0.5;
  return g;
}
function succulent(parent, x, y, z) {
  const g = group(x, y, z, parent);
  pot(g, 0.04, 0.045, 0xf1eee8);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const m = mesh(new THREE.ConeGeometry(0.012, 0.045, 4), M(i % 2 ? 0x7fb59a : 0x9cc8ae, { flat: true }), Math.cos(a) * 0.018, 0.06, Math.sin(a) * 0.018, g);
    m.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
  }
  return g;
}
// money plant (pothos): variegated heart leaves trailing down
function moneyPlant(parent, x, y, z, vines = 5, len = 0.4) {
  const g = group(x, y, z, parent);
  pot(g, 0.07, 0.1, 0x2f6f78, { glossy: true, rim: 0xe9e1cf }); // glazed ceramic
  const leafGeo = new THREE.SphereGeometry(0.03, 6, 4); leafGeo.scale(1, 0.22, 0.85);
  const f = group(0, 0.1, 0, g);
  for (let i = 0; i < 7; i++) {
    const a = rnd() * 6.28, m = mesh(leafGeo, M(i % 2 ? 0x3f8f3a : 0x9cc95a, { flat: true }), Math.cos(a) * 0.04, 0.03 + rnd() * 0.05, Math.sin(a) * 0.04, f);
    m.rotation.set(rnd() - 0.5, a, 0.4);
  }
  for (let v = 0; v < vines; v++) {
    const a = -Math.PI / 2 + (v / (vines - 1) - 0.5) * 2.4;
    const vine = group(Math.cos(a) * 0.065, 0.1, Math.sin(a) * 0.065, g);
    const n = 6 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      const tt = k / n, out = 0.02 + tt * 0.04;
      const m = mesh(leafGeo, M(k % 3 === 0 ? 0x9cc95a : 0x3f8f3a, { flat: true }), Math.cos(a) * out, -tt * len * (0.7 + rnd() * 0.5), Math.sin(a) * out, vine);
      m.rotation.set(1.1, a + (k % 2 ? 0.6 : -0.6), 0);
    }
    swayers.push({ o: vine, ph: v + rnd(), amp: 0.06 });
  }
  return g;
}
function flowers(parent, x, y, z) {
  const g = group(x, y, z, parent);
  pot(g, 0.055, 0.08, 0xe7dccb);
  const f = group(0, 0.08, 0, g);
  const cols = [0xf06a8a, 0xffc857, 0xf06a8a, 0xff9f6b, 0xf8f4ff];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.28, hgt = 0.09 + rnd() * 0.09, xx = Math.cos(a) * 0.025, zz = Math.sin(a) * 0.025;
    const stem = cyl(0.003, 0.003, hgt, M(0x4b8a3c), xx, hgt / 2, zz, f, 5); stem.castShadow = false;
    const bloom = group(xx, hgt, zz, f);
    for (let p = 0; p < 5; p++) {
      const b = mesh(new THREE.SphereGeometry(0.013, 6, 4), M(cols[i % cols.length], { flat: true }), Math.cos(p * 1.256) * 0.014, 0, Math.sin(p * 1.256) * 0.014, bloom);
      b.scale.y = 0.4;
    }
    mesh(new THREE.SphereGeometry(0.008, 6, 4), M(0xffd23f), 0, 0.004, 0, bloom);
    const lf = mesh(new THREE.SphereGeometry(0.02, 5, 3), M(0x4f9a46, { flat: true }), xx * 1.6, hgt * 0.35, zz * 1.6, f); lf.scale.set(1, 0.2, 0.5);
  }
  swayers.push({ o: f, ph: rnd() * 6, amp: 0.05 });
  return g;
}

/* ───────────────────────── stations ───────────────────────── */
const stations = [];
function station(def) {
  def.group = def.group || group();
  def.group.userData.station = def;
  def.index = stations.length;
  stations.push(def);
  return def;
}

/* ── desk ── */
const desk = group(0, 0, -R + 0.36);
box(2.0, 0.04, 0.68, M(0x8a5a3c, { r: 0.55 }), 0, DESK_Y - 0.02, 0, desk);
for (const sx of [-0.97, 0.97]) box(0.04, DESK_Y - 0.04, 0.64, M(0x2b2e33, { r: 0.5, m: 0.4 }), sx, (DESK_Y - 0.04) / 2, 0, desk);
box(1.9, 0.08, 0.02, M(0x2b2e33, { r: 0.5, m: 0.4 }), 0, DESK_Y - 0.1, -0.3, desk);
const DZ = -R + 0.36; // desk centre z

/* ── 27" monitor: IoT & Cloud command center ── */
const screen27 = canvasTex(1024, 576);
const st27 = station({ id: "command", label: "Command center", short: "27″ monitor",
  pin: [-0.3, 1.3, -1.34], cam: [-0.45, 1.32, -0.05], target: [-0.22, 1.04, -1.38] });
{
  const g = st27.group; g.position.set(-0.3, DESK_Y, -1.36);
  box(0.22, 0.012, 0.16, M(0x1f2328, { r: 0.4, m: 0.6 }), 0, 0.006, 0.02, g);
  box(0.04, 0.2, 0.025, M(0x1f2328, { r: 0.4, m: 0.6 }), 0, 0.11, -0.01, g);
  box(0.62, 0.36, 0.025, M(0x15181c, { r: 0.5 }), 0, 0.28, 0.01, g);
  const scr = mesh(new THREE.PlaneGeometry(0.6, 0.338), new THREE.MeshBasicMaterial({ map: screen27.tex, toneMapped: false }), 0, 0.28, 0.0235, g);
  scr.castShadow = false; scr.userData.screen = true;
}

/* ── 24" vertical monitor: AI & data lab ── */
const screen24 = canvasTex(512, 904);
const st24 = station({ id: "ai", label: "AI & data lab", short: "24″ vertical",
  pin: [0.22, 1.48, -1.3], cam: [-0.05, 1.32, -0.2], target: [0.25, 1.1, -1.34] });
{
  const g = st24.group; g.position.set(0.22, DESK_Y, -1.34); g.rotation.y = -0.22;
  box(0.2, 0.012, 0.15, M(0x1f2328, { r: 0.4, m: 0.6 }), 0, 0.006, 0.02, g);
  box(0.04, 0.12, 0.025, M(0x1f2328, { r: 0.4, m: 0.6 }), 0, 0.07, -0.01, g);
  box(0.31, 0.545, 0.025, M(0x15181c, { r: 0.5 }), 0, 0.38, 0.01, g);
  const scr = mesh(new THREE.PlaneGeometry(0.295, 0.525), new THREE.MeshBasicMaterial({ map: screen24.tex, toneMapped: false }), 0, 0.38, 0.0235, g);
  scr.castShadow = false; scr.userData.screen = true;
}

/* ── electronics bench: ESP32, breadboard, sensors ── */
const stBench = station({ id: "bench", label: "Electronics bench", short: "ESP32 & sensors",
  pin: [0.44, 0.88, -0.98], cam: [0.3, 1.12, -0.52], target: [0.44, 0.78, -1.0] });
let espLed;
{
  const g = stBench.group; g.position.set(0.44, DESK_Y, -1.0);
  box(0.24, 0.006, 0.15, M(0x1d6b5a, { r: 0.9 }), 0, 0.003, 0, g); // cutting mat
  const bbTex = canvasTex(256, 96, (c, w, h) => { c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, w, h); c.fillStyle = "#c33"; c.fillRect(0, 6, w, 2); c.fillStyle = "#33c"; c.fillRect(0, h - 8, w, 2); c.fillStyle = "#5c5a55"; for (let x = 6; x < w; x += 8) for (let y = 14; y < h - 12; y += 8) if (Math.abs(y - h / 2) > 5) c.fillRect(x, y, 3, 3); }).tex;
  const bb = box(0.165, 0.01, 0.06, [M(0xf4f1ea), M(0xf4f1ea), new THREE.MeshStandardMaterial({ map: bbTex, roughness: 0.9 }), M(0xf4f1ea), M(0xf4f1ea), M(0xf4f1ea)], 0.0, 0.011, 0.02, g);
  box(0.055, 0.008, 0.028, M(0x16181c, { r: 0.6 }), -0.02, 0.02, 0.02, g); // ESP32 board
  box(0.018, 0.004, 0.016, M(0xc0c6cc, { r: 0.3, m: 0.9 }), -0.03, 0.026, 0.02, g); // RF shield
  espLed = mesh(new THREE.SphereGeometry(0.0035, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3ee6c1 }), 0.002, 0.026, 0.028, g);
  // OLED module
  box(0.028, 0.004, 0.028, M(0x1b3a6b), 0.05, 0.02, 0.02, g);
  const oled = canvasTex(64, 64, (c) => { c.fillStyle = "#020608"; c.fillRect(0, 0, 64, 64); c.fillStyle = "#7fe9ff"; c.font = "bold 13px monospace"; c.fillText("23.4°", 6, 26); c.fillText("61%", 6, 48); }).tex;
  const o = mesh(new THREE.PlaneGeometry(0.022, 0.018), new THREE.MeshBasicMaterial({ map: oled, toneMapped: false }), 0.05, 0.0225, 0.02, g); o.rotation.x = -Math.PI / 2;
  // jumper wires
  for (const [col, a, b] of [[0xe5484d, [-0.04, 0.02, 0.03], [0.03, 0.016, 0.0]], [0xf5c542, [-0.01, 0.02, 0.03], [0.05, 0.016, 0.04]], [0x4a7cf7, [0.0, 0.02, 0.012], [0.07, 0.016, 0.01]]]) {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3((a[0] + b[0]) / 2, 0.05, (a[2] + b[2]) / 2), new THREE.Vector3(...b)]);
    mesh(new THREE.TubeGeometry(c, 16, 0.0015, 5), M(col, { r: 0.5 }), 0, 0, 0, g);
  }
  // multimeter
  const mm = group(0.1, 0, -0.03, g); mm.rotation.y = -0.4;
  box(0.05, 0.016, 0.09, M(0xf2b134, { r: 0.7 }), 0, 0.008, 0, mm);
  box(0.034, 0.002, 0.024, M(0x9fb6a1, { r: 0.3 }), 0, 0.017, -0.022, mm);
  cyl(0.012, 0.012, 0.004, M(0x222222), 0, 0.017, 0.015, mm, 16);
  // soldering iron stand
  const si = group(-0.1, 0, -0.04, g);
  cyl(0.02, 0.025, 0.012, M(0x2b2e33, { m: 0.5, r: 0.4 }), 0, 0.006, 0, si);
  const coil = mesh(new THREE.TorusGeometry(0.01, 0.002, 6, 16), M(0xc0c6cc, { m: 0.9, r: 0.3 }), 0, 0.04, 0, si); coil.rotation.x = 1.2;
}

/* ── Creality K1C 3D printer (CoreXY: bed lowers, head moves in X/Y) ── */
const stPrinter = station({ id: "printer", label: "3D printer", short: "Creality K1C",
  pin: [0.74, 1.34, -1.2], cam: [0.28, 1.32, -0.2], target: [0.76, 0.98, -1.2] });
const PR = { W: 0.355, H: 0.48, D: 0.355 };
let printer = {};
{
  const g = stPrinter.group; g.position.set(0.74, DESK_Y, -1.2);
  const dark = M(0x26292d, { r: 0.55, m: 0.3 }), frame = M(0x1b1d20, { r: 0.4, m: 0.6 });
  box(PR.W, 0.12, PR.D, dark, 0, 0.06, 0, g);                         // base
  box(PR.W, PR.H - 0.12, 0.012, dark, 0, 0.12 + (PR.H - 0.12) / 2, -PR.D / 2 + 0.006, g); // back
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.018, PR.H - 0.12, 0.018, frame, sx * (PR.W / 2 - 0.009), 0.12 + (PR.H - 0.12) / 2, sz * (PR.D / 2 - 0.009), g);
  box(PR.W, 0.02, PR.D, frame, 0, PR.H - 0.01, 0, g);                   // top ring (lid frame)
  const glass = M(0x9fc3d6, { r: 0.05, op: 0.16, ds: true });
  box(PR.W - 0.03, PR.H - 0.15, 0.004, glass, 0, 0.12 + (PR.H - 0.14) / 2, PR.D / 2 - 0.004, g);   // front door
  for (const sx of [-1, 1]) box(0.004, PR.H - 0.15, PR.D - 0.03, glass, sx * (PR.W / 2 - 0.004), 0.12 + (PR.H - 0.14) / 2, 0, g);
  box(PR.W - 0.03, 0.004, PR.D - 0.03, glass, 0, PR.H + 0.002, 0, g);   // glass lid
  box(0.014, 0.05, 0.01, frame, PR.W / 2 - 0.03, 0.27, PR.D / 2 + 0.006, g); // door handle
  // touch screen
  const prScreen = canvasTex(160, 96);
  const s = mesh(new THREE.PlaneGeometry(0.075, 0.045), new THREE.MeshBasicMaterial({ map: prScreen.tex, toneMapped: false }), 0, 0.06, PR.D / 2 + 0.002, g);
  s.rotation.x = -0.2; s.castShadow = false;
  // spool on the side
  const spool = group(PR.W / 2 + 0.035, 0.3, -0.06, g); spool.rotation.z = Math.PI / 2;
  cyl(0.09, 0.09, 0.006, M(0x2b2e33), 0, -0.03, 0, spool, 32);
  cyl(0.09, 0.09, 0.006, M(0x2b2e33), 0, 0.03, 0, spool, 32);
  cyl(0.078, 0.078, 0.054, M(0x3ee6c1, { r: 0.45 }), 0, 0, 0, spool, 32);
  // bed, gantry, head
  const BED0 = 0.33, NOZ = 0.36, OBJH = 0.12;
  const bed = group(0, BED0, 0, g);
  box(0.24, 0.008, 0.24, M(0x3a3f45, { r: 0.35, m: 0.5 }), 0, -0.004, 0, bed);
  box(0.23, 0.002, 0.23, M(0x6a6f2a, { r: 0.5 }), 0, 0.001, 0, bed);   // PEI sheet
  for (const sx of [-1, 1]) cyl(0.004, 0.004, BED0 - 0.12, M(0xc0c6cc, { m: 0.9, r: 0.3 }), sx * 0.13, 0.12 + (BED0 - 0.12) / 2, -0.14, g, 8);
  const gantry = box(PR.W - 0.04, 0.012, 0.014, M(0x30343a, { m: 0.6, r: 0.4 }), 0, NOZ + 0.045, 0, g);
  const head = group(0, NOZ, 0, g);
  box(0.05, 0.055, 0.045, M(0x1a1c1f, { r: 0.5 }), 0, 0.03, 0, head);
  box(0.03, 0.01, 0.03, M(0xffb547, { e: 0xffb547, ei: 0.2 }), 0, 0.06, 0, head);
  mesh(new THREE.ConeGeometry(0.004, 0.01, 8), M(0xc9a227, { m: 0.9, r: 0.3 }), 0, -0.002, 0, head).rotation.x = Math.PI;
  // the print: a twisted vase, revealed by a clipping plane at the nozzle height
  const prof = [];
  for (let i = 0; i <= 24; i++) { const v = i / 24; prof.push(new THREE.Vector2(0.032 + 0.018 * Math.sin(v * Math.PI * 1.1) + (v > 0.85 ? (v - 0.85) * 0.08 : 0), v * OBJH)); }
  const vaseGeo = new THREE.LatheGeometry(prof, 10);
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const vase = mesh(vaseGeo, new THREE.MeshStandardMaterial({ color: 0x3ee6c1, roughness: 0.45, flatShading: true, side: THREE.DoubleSide, clippingPlanes: [clip] }), 0, 0, 0, bed);
  const chamberLight = new THREE.PointLight(0xfff3dd, 0.25, 0.5, 2); chamberLight.position.set(0, PR.H - 0.05, 0); g.add(chamberLight);
  printer = { g, bed, head, gantry, clip, BED0, NOZ, OBJH, prScreen, vase, p: 0, hold: 0 };
}

/* ── flower + money plant (left of the 27") with a small wall shelf of plants above ── */
const stPlants = station({ id: "plants", label: "Plants", short: "money plant & flowers",
  pin: [-0.82, 1.42, -1.28], cam: [-0.38, 1.32, -0.68], target: [-0.8, 1.08, -1.3] });
{
  const g = stPlants.group;
  flowers(g, -0.84, DESK_Y, -1.24);
  // little wooden riser so the ceramic money-plant pot sits above the flowers
  const riser = group(-0.84, DESK_Y, -1.42, g);
  for (const sx of [-1, 1]) box(0.012, 0.3, 0.012, M(0x6b4a2f), sx * 0.07, 0.15, 0, riser);
  box(0.17, 0.012, 0.1, M(0x8a5a3c), 0, 0.3, 0.02, riser);
  moneyPlant(g, -0.84, DESK_Y + 0.306, -1.4, 6, 0.38);
  // the very small shelf above the monitors and printer
  const shelf = group(0.2, 1.62, -R + 0.08, g);
  box(1.5, 0.022, 0.15, M(0x8a5a3c, { r: 0.55 }), 0, 0, 0, shelf);
  for (const sx of [-0.6, 0.6]) box(0.015, 0.06, 0.12, M(0x2b2e33), sx, -0.04, 0, shelf);
  succulent(shelf, -0.6, 0.011, 0);
  cactus(shelf, -0.38, 0.011, 0.01);
  moneyPlant(shelf, -0.12, 0.011, 0, 4, 0.22);
  leafy(shelf, 0.18, 0.011, 0, 0.8, 0xc96f4a);
  succulent(shelf, 0.4, 0.011, 0.01);
  leafy(shelf, 0.62, 0.011, 0, 0.75, 0xf1eee8, 0x2f7a43);
}

/* ── desk props: keyboard, mouse, chai ── */
{
  const kb = group(-0.3, DESK_Y, -1.0);
  box(0.44, 0.022, 0.14, M(0x2b2f36, { r: 0.6 }), 0, 0.011, 0, kb);
  const keys = canvasTex(256, 80, (c, w, h) => { c.fillStyle = "#2b2f36"; c.fillRect(0, 0, w, h); for (let r = 0; r < 5; r++) for (let k = 0; k < 16; k++) { c.fillStyle = r === 4 && k > 4 && k < 11 ? "#3a3f48" : "#3a3f48"; c.fillRect(4 + k * 15.6, 4 + r * 15, 13, 12); } c.fillStyle = "#3ee6c1"; c.fillRect(4, 4, 13, 12); }).tex;
  const top = mesh(new THREE.PlaneGeometry(0.43, 0.13), new THREE.MeshStandardMaterial({ map: keys, roughness: 0.6 }), 0, 0.0225, 0, kb); top.rotation.x = -Math.PI / 2;
  const mouse = mesh(new THREE.CapsuleGeometry(0.022, 0.04, 4, 8), M(0x2b2f36, { r: 0.4 }), 0.0, DESK_Y + 0.012, -0.98); mouse.rotation.x = Math.PI / 2; mouse.scale.set(1, 1, 0.5); scene.add(mouse);
  mouse.position.x = 0.04;
  const mug = group(-0.62, DESK_Y, -0.95);
  cyl(0.04, 0.036, 0.09, M(0xf3efe7, { r: 0.35 }), 0, 0.045, 0, mug);
  cyl(0.035, 0.035, 0.004, M(0xb07a45, { r: 0.3 }), 0, 0.08, 0, mug);
  const handle = mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16, Math.PI), M(0xf3efe7, { r: 0.35 }), 0.042, 0.045, 0, mug); handle.rotation.z = -Math.PI / 2;
  // steam
  const steam = [];
  for (let i = 0; i < 6; i++) { const s = mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }), 0, 0.1, 0, mug); s.castShadow = false; steam.push({ s, o: i / 6 }); }
  animators.push((t) => steam.forEach((p) => { const k = (t * 0.25 + p.o) % 1; p.s.position.set(Math.sin(k * 8 + p.o * 9) * 0.01, 0.1 + k * 0.14, 0); p.s.scale.setScalar(0.6 + k * 1.4); p.s.material.opacity = 0.28 * (1 - k); }));
}

/* ── office chair ── */
{
  const ch = group(-0.18, 0, -0.5); ch.rotation.y = 0.15;
  const black = M(0x24282e, { r: 0.6 }), metal = M(0x9aa3ad, { m: 0.8, r: 0.3 });
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; const leg = box(0.3, 0.025, 0.04, metal, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15, ch); leg.rotation.y = -a; mesh(new THREE.SphereGeometry(0.022, 8, 6), black, Math.cos(a) * 0.29, 0.022, Math.sin(a) * 0.29, ch); }
  cyl(0.022, 0.022, 0.34, metal, 0, 0.24, 0, ch, 12);
  box(0.5, 0.07, 0.48, black, 0, 0.45, 0, ch);
  box(0.46, 0.55, 0.05, M(0x2e353d, { r: 0.8 }), 0, 0.8, 0.25, ch).rotation.x = -0.12;
  for (const sx of [-1, 1]) { box(0.04, 0.2, 0.04, black, sx * 0.24, 0.56, 0.02, ch); box(0.06, 0.025, 0.24, black, sx * 0.24, 0.66, 0.02, ch); }
}

/* ── beige sofa (behind the chair) + floor lamp ── */
const stSofa = station({ id: "sofa", label: "Thinking corner", short: "beige sofa",
  pin: [0.2, 1.02, 1.18], cam: [-0.5, 1.95, -0.95], target: [0.25, 0.5, 1.05] });
let lampLight;
{
  const g = stSofa.group; g.position.set(0.2, 0, 1.13);
  const beige = M(0xd8c4a3, { r: 0.95 }), beige2 = M(0xe4d5b9, { r: 0.95 });
  box(1.8, 0.24, 0.78, beige, 0, 0.2, 0, g);
  for (const sx of [-1, 1]) box(0.16, 0.56, 0.8, beige, sx * 0.83, 0.32, 0, g);
  box(1.5, 0.45, 0.18, beige, 0, 0.52, 0.31, g);
  for (let i = 0; i < 3; i++) { box(0.48, 0.1, 0.56, beige2, -0.5 + i * 0.5, 0.37, -0.06, g); const b = box(0.46, 0.36, 0.12, beige2, -0.5 + i * 0.5, 0.6, 0.2, g); b.rotation.x = 0.15; }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.02, 0.015, 0.08, M(0x5a3d26), sx * 0.85, 0.04, sz * 0.33, g, 8);
  const p1 = box(0.3, 0.3, 0.1, M(0x3c7d78, { r: 0.95 }), -0.56, 0.58, 0.07, g); p1.rotation.set(0.25, 0.3, 0.12);
  const p2 = box(0.28, 0.28, 0.1, M(0xd49a3a, { r: 0.95 }), 0.58, 0.58, 0.07, g); p2.rotation.set(0.25, -0.35, -0.1);
  const throwB = box(0.5, 0.02, 0.56, M(0x6c7fa6, { r: 1 }), 0.45, 0.43, -0.04, g); throwB.rotation.z = 0.05;
  // floor lamp in the corner
  const lamp = group(1.13, 0, 0.12, g);
  cyl(0.12, 0.13, 0.025, M(0x1f2328, { m: 0.6, r: 0.4 }), 0, 0.012, 0, lamp, 24);
  cyl(0.01, 0.01, 1.45, M(0x1f2328, { m: 0.6, r: 0.4 }), 0, 0.74, 0, lamp, 8);
  cyl(0.11, 0.17, 0.2, M(0xf3e6cc, { r: 1, e: 0xffd9a0, ei: 0.35, ds: true }), 0, 1.5, 0, lamp, 24).castShadow = false;
  lampLight = new THREE.PointLight(0xffc98a, 1, 5, 1.6); lampLight.position.set(0, 1.45, 0); lampLight.castShadow = true; lampLight.shadow.mapSize.set(512, 512); lampLight.shadow.bias = -0.003; lamp.add(lampLight);
}

/* ── bookshelf (behind-left of the chair) with retro speaker, plants, books ── */
const stLibrary = station({ id: "library", label: "Bookshelf", short: "tech & philosophy",
  pin: [-1.3, 1.95, 0.25], cam: [0.55, 1.45, 0.75], target: [-1.3, 0.95, 0.25] });
let speakerLed;
{
  const g = stLibrary.group; g.position.set(-R + 0.17, 0, 0.25);
  const wood = M(0x7a5236, { r: 0.7 }), W = 0.8, D = 0.3, HH = 1.82;
  box(D, 0.02, W, wood, 0, HH, 0, g);
  box(0.02, HH, W, M(0x6b4730, { r: 0.8 }), -D / 2 + 0.01, HH / 2, 0, g);
  for (const sz of [-1, 1]) box(D, HH, 0.022, wood, 0, HH / 2, sz * (W / 2 - 0.011), g);
  const shelvesY = [0.04, 0.4, 0.76, 1.12, 1.47];
  shelvesY.forEach((y) => box(D, 0.022, W, wood, 0, y, 0, g));
  const tech = [0x1f4e79, 0x2a6f97, 0x3ee6c1, 0x264653, 0x0f766e, 0x334155, 0xe9edf2, 0x6d28d9];
  const philo = [0x9c6644, 0x7f5539, 0xb08968, 0xa44a3f, 0xddb892, 0x582f0e, 0xc9a227];
  const fill = (y, z0, z1, pal) => {
    let z = z0;
    while (z < z1 - 0.03) {
      const w = 0.022 + rnd() * 0.03, h = 0.2 + rnd() * 0.1, d = 0.17 + rnd() * 0.06;
      if (z + w > z1) break;
      const b = box(d, h, w, M(pick(pal), { r: 0.85 }), 0.02 - (0.22 - d) / 2, y + 0.011 + h / 2, z + w / 2, g);
      if (rnd() < 0.08 && z + 0.12 < z1) { b.rotation.x = -0.22; b.position.y -= 0.01; b.position.z += 0.025; z += 0.04; }
      z += w + 0.002;
    }
  };
  fill(shelvesY[0], -0.38, 0.36, tech);
  fill(shelvesY[1], -0.38, 0.05, philo); leafy(g, 0.02, shelvesY[1] + 0.011, 0.2, 0.9, 0xf1eee8);
  // retro Bluetooth speaker
  const sp = group(0.02, shelvesY[2] + 0.011, -0.2, g); sp.rotation.y = Math.PI / 2;
  box(0.24, 0.15, 0.12, M(0x8b5a2b, { r: 0.55 }), 0, 0.075, 0, sp);
  const grille = canvasTex(128, 80, (c, w, h) => { c.fillStyle = "#3b3431"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,.08)"; for (let x = 0; x < w; x += 4) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } }).tex;
  mesh(new THREE.PlaneGeometry(0.15, 0.11), new THREE.MeshStandardMaterial({ map: grille, roughness: 1 }), -0.03, 0.075, 0.061, sp);
  for (const ky of [0.1, 0.05]) { const k = cyl(0.011, 0.011, 0.012, M(0xc9a227, { m: 0.9, r: 0.3 }), 0.08, ky, 0.064, sp, 16); k.rotation.x = Math.PI / 2; }
  speakerLed = mesh(new THREE.SphereGeometry(0.004, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb547 }), 0.08, 0.025, 0.062, sp);
  const hnd = mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 20, Math.PI), M(0x3b2a1e, { r: 0.6 }), 0, 0.15, 0, sp);
  fill(shelvesY[2], 0.0, 0.36, tech);
  fill(shelvesY[3], -0.38, 0.1, philo); succulent(g, 0.02, shelvesY[3] + 0.011, 0.26);
  snake(g, 0.02, shelvesY[4] + 0.011, -0.24, 1);
  fill(shelvesY[4], -0.1, 0.36, [...tech, ...philo]);
  moneyPlant(g, 0.03, HH + 0.01, 0.15, 5, 0.45);
  leafy(g, 0.03, HH + 0.01, -0.2, 0.9, 0xc96f4a);
}

/* ── glass door-cum-window + balcony ── */
const stBalcony = station({ id: "balcony", label: "Balcony", short: "the cloud & contact",
  pin: [2.15, 1.45, 0.0], cam: [-0.35, 1.55, 0.85], target: [2.3, 1.6, -0.15] });
let slidingPane, cloud;
{
  const g = stBalcony.group;
  const alu = M(0x3b4148, { r: 0.35, m: 0.7 }), glass = M(0xbfe3f2, { r: 0.05, op: 0.14, ds: true });
  const fx = R + 0.05;
  box(0.1, 0.04, OPEN_Z1 - OPEN_Z0, alu, fx, 0.02, 0, g);
  box(0.1, 0.05, OPEN_Z1 - OPEN_Z0, alu, fx, OPEN_H - 0.025, 0, g);
  for (const z of [OPEN_Z0, OPEN_Z1]) box(0.1, OPEN_H, 0.04, alu, fx, OPEN_H / 2, z, g);
  const paneW = (OPEN_Z1 - OPEN_Z0) / 2 + 0.03;
  const fixed = group(fx + 0.02, 0, OPEN_Z0 + paneW / 2, g);
  box(0.03, OPEN_H - 0.06, paneW, glass, 0, OPEN_H / 2, 0, fixed);
  for (const z of [-paneW / 2, paneW / 2]) box(0.035, OPEN_H - 0.06, 0.03, alu, 0, OPEN_H / 2, z, fixed);
  slidingPane = group(fx - 0.02, 0, OPEN_Z1 - paneW / 2, g);
  box(0.03, OPEN_H - 0.06, paneW, glass, 0, OPEN_H / 2, 0, slidingPane);
  for (const z of [-paneW / 2, paneW / 2]) box(0.035, OPEN_H - 0.06, 0.03, alu, 0, OPEN_H / 2, z, slidingPane);
  box(0.03, 0.12, 0.015, M(0x9aa3ad, { m: 0.8, r: 0.3 }), -0.03, 1.05, -paneW / 2 + 0.05, slidingPane);
  slidingPane.userData.closedZ = slidingPane.position.z;
  // sheer curtain
  const cur = group(R - 0.05, 0, OPEN_Z1 + 0.12, g);
  for (let i = 0; i < 5; i++) box(0.02, OPEN_H + 0.1, 0.06, M(0xf5efe4, { r: 1, op: 0.85 }), (i % 2) * 0.03, (OPEN_H + 0.1) / 2, i * 0.045 - 0.09, cur);
  // balcony slab, tiles and railing
  const BX = R + 0.1, BW = 1.25;
  const tiles = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#b9b1a4"; c.fillRect(0, 0, w, h); c.strokeStyle = "#9d958a"; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); } }).tex;
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(2, 4);
  box(BW, 0.12, 2.6, new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.9 }), BX + BW / 2, -0.08, 0, g).castShadow = false;
  const rail = M(0x2f353c, { r: 0.4, m: 0.7 });
  const RX = BX + BW - 0.04;
  box(0.04, 0.04, 2.6, rail, RX, 1.0, 0, g);
  for (let z = -1.25; z <= 1.26; z += 0.13) box(0.015, 1.0, 0.015, rail, RX, 0.5, z, g);
  for (const sz of [-1.28, 1.28]) { box(BW, 0.04, 0.04, rail, BX + BW / 2, 1.0, sz, g); for (let x = BX + 0.1; x < RX; x += 0.13) box(0.015, 1.0, 0.015, rail, x, 0.5, sz, g); }
  leafy(g, BX + 0.9, 0, -0.9, 2.4, 0xc96f4a);
  snake(g, BX + 0.95, 0, 0.85, 2.2);
  flowers(g, BX + 0.95, 1.02, 0.2);
  moneyPlant(g, BX + 0.25, 0, 1.0, 5, 0.35);
  // a small low-poly cloud: literally where the packets go
  cloud = group(BX + 0.75, 2.25, -0.1, g);
  const cm = M(0xffffff, { flat: true, r: 1, e: 0xdff6ff, ei: 0.25 });
  [[0, 0, 0, 0.22], [0.22, -0.04, 0.05, 0.16], [-0.22, -0.05, -0.02, 0.17], [0.08, 0.12, -0.04, 0.16], [-0.1, 0.08, 0.08, 0.14]].forEach(([x, y, z, r]) => mesh(new THREE.IcosahedronGeometry(r, 1), cm, x, y, z, cloud));
}

/* ───────────────────────── lights ───────────────────────── */
const hemi = new THREE.HemisphereLight(0xdff0ff, 0xb59b7c, 1.4); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
sun.position.set(5, 4.2, 1.2); sun.target.position.set(0, 0.5, -0.3); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 14 });
const fill = new THREE.DirectionalLight(0xcfe0ff, 0.5); fill.position.set(-4, 3, 5); scene.add(fill);
const screenGlow = new THREE.PointLight(0x7fd8ff, 0.6, 1.6, 2); screenGlow.position.set(-0.05, 1.1, -1.05); scene.add(screenGlow);
const LIGHTS = {
  day:   { hemi: 1.4,  hemiSky: 0xdff0ff, hemiGround: 0xb59b7c, sun: 2.4, sunColor: 0xfff0d8, fill: 0.5, lamp: 0.25, glow: 0.5, exposure: 1.05 },
  night: { hemi: 0.28, hemiSky: 0x55639e, hemiGround: 0x2a2230, sun: 0.35, sunColor: 0x9fb3ff, fill: 0.12, lamp: 2.6, glow: 1.6, exposure: 1.1 },
};
let mode = new Date().getHours() >= 6 && new Date().getHours() < 19 ? "day" : "night";
let systemsOn = false;
const lightState = { ...LIGHTS[mode] };
const tmpC = new THREE.Color();
function updateLights(dt) {
  const tgt = LIGHTS[mode], k = Math.min(1, dt * 3), dim = systemsOn ? 0.45 : 1;
  for (const key of ["hemi", "sun", "fill", "lamp", "glow", "exposure"]) {
    const goal = key === "exposure" ? tgt[key] : key === "glow" ? tgt[key] : tgt[key] * dim;
    lightState[key] += (goal - lightState[key]) * k;
  }
  hemi.intensity = lightState.hemi; sun.intensity = lightState.sun; fill.intensity = lightState.fill;
  lampLight.intensity = lightState.lamp; screenGlow.intensity = lightState.glow; renderer.toneMappingExposure = lightState.exposure;
  hemi.color.lerp(tmpC.set(tgt.hemiSky), k); hemi.groundColor.lerp(tmpC.set(tgt.hemiGround), k); sun.color.lerp(tmpC.set(tgt.sunColor), k);
}

/* ───────────────────────── systems view: how the pieces connect ───────────────────────── */
const flows = new THREE.Group(); scene.add(flows); flows.visible = false;
const pinsEl = $("#pins");
const flowDefs = [
  { label: "sense", color: 0x7bd88f, pts: [[-0.84, 1.18, -1.4], [-0.4, 1.3, -1.1], [0.1, 0.95, -0.95], [0.42, 0.8, -0.98]] },
  { label: "prototype → product", color: AMBER, pts: [[0.74, 0.95, -1.04], [0.62, 1.02, -0.9], [0.48, 0.82, -0.98]] },
  { label: "MQTT telemetry", color: ACCENT, pts: [[0.42, 0.8, -0.98], [0.1, 1.15, -1.05], [-0.25, 1.06, -1.33]] },
  { label: "Azure IoT Hub", color: ACCENT, pts: [[-0.25, 1.15, -1.33], [0.5, 1.95, -0.6], [1.4, 1.75, -0.2], [2.25, 2.2, -0.1]] },
  { label: "OTA updates", color: AMBER, pts: [[2.2, 2.15, -0.15], [1.3, 1.4, 0.2], [0.7, 0.95, -0.6], [0.46, 0.8, -0.98]] },
  { label: "knowledge → models", color: VIOLET, pts: [[-1.2, 1.25, 0.25], [-0.6, 1.7, -0.3], [0.1, 1.55, -1.1], [0.22, 1.3, -1.32]] },
  { label: "AI at the edge", color: VIOLET, pts: [[0.2, 1.05, -1.32], [0.0, 0.92, -1.25], [-0.1, 1.0, -1.33]] },
];
const packets = [];
flowDefs.forEach((f, i) => {
  const curve = new THREE.CatmullRomCurve3(f.pts.map((p) => new THREE.Vector3(...p)));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.006, 6), new THREE.MeshBasicMaterial({ color: f.color, transparent: true, opacity: 0.55, toneMapped: false }));
  flows.add(tube);
  for (let k = 0; k < 3; k++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), new THREE.MeshBasicMaterial({ color: f.color, toneMapped: false }));
    flows.add(s); packets.push({ s, curve, t: k / 3 + i * 0.07, speed: 0.12 + (i % 3) * 0.03 });
  }
  const el = document.createElement("span"); el.className = "flow-label"; el.textContent = f.label; el.style.color = "#" + f.color.toString(16).padStart(6, "0");
  pinsEl.appendChild(el); f.el = el; f.mid = curve.getPoint(0.5);
});

/* ───────────────────────── live screens ───────────────────────── */
let repos = [];
fetch("https://api.github.com/users/" + (P.githubUser || "bhattvishal") + "/repos?sort=pushed&per_page=100")
  .then((r) => (r.ok ? r.json() : []))
  .then((list) => { repos = list.filter((r) => !r.fork && !/github\.io$|^bhattvishal$/i.test(r.name)).sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 6); if (current) openPanel(current, true); })
  .catch(() => {});
const FALLBACK_REPOS = ["can-2-ble-esp32", "iot-azure-mobilesensors", "iot-smarthome-smartpixels", "machinelearning-tflite-helloworld", "programming-learning-python"];

const series = [[], [], []];
function drawScreen27(t) {
  const c = screen27.ctx, W = 1024, Hh = 576;
  c.fillStyle = "#0b1016"; c.fillRect(0, 0, W, Hh);
  c.fillStyle = "#121a23"; c.fillRect(0, 0, W, 44);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(22 + i * 20, 22, 6, 0, 7); c.fill(); });
  c.font = "500 20px JetBrains Mono, monospace"; c.fillStyle = "#8b9aab"; c.fillText("fleet.telemetry — azure-iot-hub", 90, 29);
  c.fillStyle = "#3ee6c1"; c.fillText("● live", 920, 29);
  // chart
  series.forEach((s, i) => { s.push(50 + Math.sin(t * (0.9 + i * 0.4) + i * 2) * 25 + Math.sin(t * 3.1 + i) * 8 + i * 30); if (s.length > 90) s.shift(); });
  c.strokeStyle = "#1c2733"; c.lineWidth = 1;
  for (let y = 80; y <= 300; y += 44) { c.beginPath(); c.moveTo(30, y); c.lineTo(620, y); c.stroke(); }
  ["#3ee6c1", "#ffb547", "#9d8cff"].forEach((col, i) => {
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath();
    series[i].forEach((v, k) => { const x = 30 + k * (590 / 89), y = 300 - v * 1.6; k ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  });
  c.fillStyle = "#8b9aab"; c.font = "16px JetBrains Mono, monospace"; c.fillText("temp · vibration · power (demo)", 30, 334);
  // device grid
  for (let r = 0; r < 4; r++) for (let k = 0; k < 18; k++) {
    const on = Math.sin(t * 2 + r * 7 + k * 13.3) > -0.85;
    c.fillStyle = !on ? "#ffb547" : (Math.sin(t * 5 + k * r) > 0.95 ? "#e6fff8" : "#1f7a66");
    c.fillRect(30 + k * 33, 360 + r * 33, 26, 26);
  }
  c.fillStyle = "#8b9aab"; c.fillText("edge nodes", 30, 520);
  // repos column
  c.fillStyle = "#121a23"; c.fillRect(650, 60, 350, 490);
  c.fillStyle = "#e6edf3"; c.font = "600 20px JetBrains Mono, monospace"; c.fillText("github.com/bhattvishal", 668, 96);
  c.font = "17px JetBrains Mono, monospace";
  const names = repos.length ? repos.map((r) => r.name) : FALLBACK_REPOS;
  names.slice(0, 6).forEach((n, i) => { c.fillStyle = i === Math.floor(t / 1.5) % names.length ? "#3ee6c1" : "#b9c6d2"; c.fillText((n.length > 27 ? n.slice(0, 26) + "…" : n), 668, 142 + i * 44); c.fillStyle = "#3a4654"; c.fillRect(668, 156 + i * 44, 310, 1); });
  c.fillStyle = "#8b9aab"; c.fillText("» click to open", 668, 530);
  screen27.tex.needsUpdate = true;
}
const agentScript = [
  ["agent", "goal: keep the fleet healthy"], ["tool", "query(adx, telemetry | summarize by node)"], ["llm", "node-17 vibration drifting +12%"],
  ["agent", "plan → fetch maintenance history"], ["tool", "cosmosdb.read(asset/node-17)"], ["llm", "bearing wear pattern likely"],
  ["agent", "act → schedule OTA config patch"], ["tool", "iothub.twin.update(node-17)"], ["ok", "patch acked in 840 ms"],
  ["agent", "reflect → add rule to edge model"], ["tool", "train(edge-anomaly, epochs=4)"], ["ok", "model v42 deployed to edge"],
  ["kafka", "stream → flink job healthy"], ["agent", "idle… watching 1,024 signals"],
];
let agentLines = [], agentIdx = 0, agentNext = 0;
function drawScreen24(t) {
  if (t > agentNext) { agentLines.push(agentScript[agentIdx % agentScript.length]); agentIdx++; agentNext = t + 0.9; if (agentLines.length > 26) agentLines.shift(); }
  const c = screen24.ctx, W = 512, Hh = 904;
  c.fillStyle = "#070b0f"; c.fillRect(0, 0, W, Hh);
  c.fillStyle = "#121a23"; c.fillRect(0, 0, W, 50);
  c.font = "600 20px JetBrains Mono, monospace"; c.fillStyle = "#9d8cff"; c.fillText("agentic-ops ▸ run", 20, 33);
  c.font = "17px JetBrains Mono, monospace";
  const col = { agent: "#9d8cff", tool: "#ffb547", llm: "#3ee6c1", ok: "#7bd88f", kafka: "#7fd8ff" };
  agentLines.forEach(([k, v], i) => {
    const y = 86 + i * 31;
    c.fillStyle = col[k]; c.fillText(k.padEnd(6), 18, y);
    c.fillStyle = "#c9d4de"; c.fillText(v.length > 34 ? v.slice(0, 33) + "…" : v, 96, y);
  });
  if (Math.floor(t * 2) % 2) { c.fillStyle = "#3ee6c1"; c.fillRect(18, 86 + agentLines.length * 31 - 16, 11, 20); }
  screen24.tex.needsUpdate = true;
}
function drawPrinterScreen(p) {
  const c = printer.prScreen.ctx; c.fillStyle = "#0d1216"; c.fillRect(0, 0, 160, 96);
  c.fillStyle = "#e6edf3"; c.font = "bold 18px sans-serif"; c.fillText(p >= 1 ? "Done ✓" : "Printing", 10, 30);
  c.fillStyle = "#2a3642"; c.fillRect(10, 52, 140, 12); c.fillStyle = "#3ee6c1"; c.fillRect(10, 52, 140 * Math.min(1, p), 12);
  c.fillStyle = "#8b9aab"; c.font = "13px monospace"; c.fillText(Math.round(Math.min(1, p) * 100) + "%  L" + Math.round(p * 600), 10, 84);
  printer.prScreen.tex.needsUpdate = true;
}

/* ───────────────────────── panel content per station ───────────────────────── */
const comp = (name) => ((P.competencies || []).find((c) => c[0] === name) || [name, []])[1];
const chips = (arr, cls = "") => '<ul class="chips ' + cls + '">' + arr.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
const notes = (arr) => '<ul class="notes">' + arr.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
const exp = (v) => (P.experience || []).find((e) => e.version === v) || { notes: [] };
const repoList = () => {
  const list = repos.length ? repos : FALLBACK_REPOS.map((n) => ({ name: n, html_url: "https://github.com/bhattvishal/" + n, stargazers_count: "" }));
  return '<ul class="repo-list">' + list.map((r) => '<li><a href="' + esc(r.html_url) + '" target="_blank" rel="noopener"><span>' + esc(r.name) + "</span><small>" + (r.stargazers_count !== "" ? "★ " + r.stargazers_count : "↗") + "</small></a></li>").join("") + "</ul>";
};
const CONTENT = {
  command: () => `<p class="kicker">27″ monitor · IoT & Cloud</p><h2>Command center</h2>
    <p class="lead">Where devices meet the cloud. I designed and architected Eaton's Cloud and IoT platform to connect millions of industrial devices — and today I architect AI-driven systems on top of it.</p>
    <h3>Shipped</h3>${notes([exp("v3").notes[0], exp("v2").notes[0], exp("v5").notes[0]].filter(Boolean))}
    <h3>Edge & IoT</h3>${chips(comp("Edge & IoT"))}
    <h3>Cloud & DevOps</h3>${chips(comp("Cloud & DevOps"))}
    <h3>On screen: my latest repositories</h3>${repoList()}`,
  ai: () => `<p class="kicker">24″ vertical monitor · AI & data</p><h2>AI & data lab</h2>
    <p class="lead">${esc((P.about || [])[2] || "")}</p>
    <h3>AI & Data Science</h3>${chips(comp("AI & Data Science"), "v")}
    <h3>Data engineering</h3>${chips(comp("Data Engineering"), "v")}
    <h3>System integration</h3>${chips(comp("System Integration"), "v")}
    <p class="soon">On screen: an illustrative agent loop — sense, reason, act, learn — the pattern I build around industrial telemetry.</p>`,
  bench: () => `<p class="kicker">ESP32 · sensors · protocols</p><h2>Electronics bench</h2>
    <p class="lead">Firmware, sensors and the industrial protocols that keep factories talking. I started on device configuration tools in 2008 and still prototype on ESP8266 / ESP32 boards at this desk.</p>
    <h3>Hardware & protocols</h3>${chips(["ESP8266 / ESP32", "C / C++", "Embedded", "CAN", "MODBUS", "PROFINET", "OTA updates", "Embedded intelligence"], "a")}
    <h3>From the bench</h3>${notes([exp("v3").notes[1], exp("v1").notes[0]].filter(Boolean))}
    <a class="btn" href="https://github.com/bhattvishal" target="_blank" rel="noopener">See the hardware repos on GitHub ↗</a>`,
  printer: () => `<p class="kicker">Creality K1C · 3D printing</p><h2>Prototype → product</h2>
    <p class="lead">The fastest way from an idea to something you can hold. Printing closes the loop between design and product: enclosures, mounts and fixtures for the hardware on the bench next to it.</p>
    <h3>The loop</h3><div class="pipeline"><span>idea</span><i>→</i><span>CAD</span><i>→</i><span>slice</span><i>→</i><span>print</span><i>→</i><span>test</span><i>↺</i></div>
    <h3>Print gallery</h3><p class="soon">Coming soon — a turntable of real prints from this machine.</p>`,
  plants: () => `<p class="kicker">Money plant · flowers · shelf garden</p><h2>Things that grow</h2>
    <p class="lead">A flower pot and a glazed money plant to the left of the big monitor, and a tiny shelf of plants above the desk. Gardening and DIY are my offline mode — and growing things takes the same patience as growing systems and teams.</p>
    <h3>Growing people too</h3>${notes([exp("v3").notes[2], exp("v4").notes[2]].filter(Boolean))}
    ${chips(["Gardening", "DIY", "Smart home", "Mentoring"])}`,
  library: () => { const inv = P.innovation || []; return `<p class="kicker">Bookshelf · tech & philosophy</p><h2>The library</h2>
    <p class="lead">A mix of technical and philosophical books — how to build things, and why. Plus a retro Bluetooth speaker for focus music, and more plants.</p>
    <h3>Inventions</h3><div class="stats">${inv.map((i) => `<div><b>${i.n}</b><span>${esc(i.label)}</span></div>`).join("")}</div>
    <h3>Certifications</h3><ul class="plain">${(P.certifications || []).map((c) => "<li>" + esc(c) + "</li>").join("")}</ul>
    <h3>Education</h3><ul class="plain">${(P.education || []).map((e) => `<li>${esc(e.degree)} · ${esc(e.period)}<small>${esc(e.field)}, ${esc(e.school)}</small></li>`).join("")}</ul>`; },
  sofa: () => `<p class="kicker">Beige sofa · the thinking corner</p><h2>Systems thinking</h2>
    <p class="lead">${esc((P.about || [])[0] || "")} ${esc((P.about || [])[1] || "")}</p>
    <p class="lead">Every object in this room is one part of a system: <b>sense</b> (plants, sensors) → <b>compute</b> (bench) → <b>connect</b> (command center) → <b>learn</b> (AI lab, books) → <b>make</b> (printer) → <b>cloud</b> (balcony).</p>
    <button class="btn" id="panel-systems">${systemsOn ? "Hide" : "Show"} the systems view</button>`,
  balcony: () => `<p class="kicker">Door-cum-window · the cloud</p><h2>The balcony is the cloud</h2>
    <p class="lead">Every packet in this room ends up out here. Your message can too — I'm always up for conversations about AI in industrial systems, IoT platforms and digital transformation.</p>
    <h3>Handshake</h3><ul class="repo-list">${(P.links || []).map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener me"><span>${esc(l.label)}</span><small>↗</small></a></li>`).join("")}</ul>
    <a class="btn" href="../${esc(P.resume || "")}" target="_blank" rel="noopener">Download résumé ↓</a>`,
};

/* ───────────────────────── UI: pins, station list, panel ───────────────────────── */
const stationNav = $("#stations"), panel = $("#panel"), panelBody = $("#panel-body");
stations.forEach((s, i) => {
  const b = document.createElement("button");
  b.innerHTML = `<span class="n">${i + 1}</span>${esc(s.label)}`;
  b.addEventListener("click", () => focusStation(s));
  stationNav.appendChild(b); s.navBtn = b;
  const pin = document.createElement("button");
  pin.className = "pin"; pin.tabIndex = -1;
  pin.innerHTML = `<span class="n">${i + 1}</span><span class="l">${esc(s.label)} · <span style="opacity:.7">${esc(s.short)}</span></span>`;
  pin.addEventListener("click", () => focusStation(s));
  pinsEl.appendChild(pin); s.pinEl = pin; s.pinV = new THREE.Vector3(...s.pin);
  // per-station material copies so hover highlight affects only this object
  s.group.traverse((o) => { if (o.isMesh && !o.userData.screen && o.material && !Array.isArray(o.material) && o.material.isMeshStandardMaterial) { o.material = o.material.clone(); s.mats = s.mats || []; s.mats.push(o.material); } });
});

let current = null;
function openPanel(s, keepScroll) {
  const sc = panel.scrollTop;
  panelBody.innerHTML = `<p class="kicker" style="color:var(--muted)">station ${s.index + 1} / ${stations.length}</p>` + CONTENT[s.id]();
  panel.hidden = false;
  if (keepScroll) panel.scrollTop = sc; else panel.scrollTop = 0;
  const ps = $("#panel-systems"); if (ps) ps.addEventListener("click", () => setSystems(!systemsOn));
}
function focusStation(s, fromTour) {
  if (!fromTour) stopTour();
  current = s;
  document.body.classList.add("focused");
  stations.forEach((o) => { o.navBtn.classList.toggle("active", o === s); o.pinEl.classList.toggle("dim", o !== s); });
  openPanel(s);
  flyTo(new THREE.Vector3(...s.cam), new THREE.Vector3(...s.target));
  history.replaceState(null, "", "#" + s.id);
}
function overview() {
  stopTour();
  current = null;
  document.body.classList.remove("focused");
  panel.hidden = true;
  stations.forEach((o) => { o.navBtn.classList.remove("active"); o.pinEl.classList.remove("dim"); });
  flyTo(OVERVIEW.pos, OVERVIEW.target);
  history.replaceState(null, "", location.pathname);
}
function step(d) { const i = current ? (current.index + d + stations.length) % stations.length : 0; focusStation(stations[i]); }
$("#panel-x").addEventListener("click", overview);
$("#btn-reset").addEventListener("click", overview);
$("#prev").addEventListener("click", () => step(-1));
$("#next").addEventListener("click", () => step(1));
addEventListener("keydown", (e) => {
  if (e.key === "Escape") overview();
  else if (e.key === "ArrowRight" && !/input/i.test(document.activeElement.tagName)) step(1);
  else if (e.key === "ArrowLeft" && !/input/i.test(document.activeElement.tagName)) step(-1);
});

/* systems + day/night toggles */
const btnSys = $("#btn-systems"), btnTime = $("#btn-time");
function setSystems(on) {
  systemsOn = on; flows.visible = true;
  document.body.classList.toggle("systems", on);
  btnSys.setAttribute("aria-pressed", on);
  if (current && current.id === "sofa") openPanel(current, true);
}
function setMode(m) {
  mode = m;
  document.body.classList.toggle("night", m === "night"); document.body.classList.toggle("day", m === "day");
  $("#time-ico").textContent = m === "day" ? "☀" : "☾"; $("#time-label").textContent = m === "day" ? "Day" : "Night";
}
btnSys.addEventListener("click", () => setSystems(!systemsOn));
btnTime.addEventListener("click", () => setMode(mode === "day" ? "night" : "day"));
setMode(mode);

/* guided tour */
const btnTour = $("#btn-tour");
let tourTimer = null;
function stopTour() { if (tourTimer) { clearInterval(tourTimer); tourTimer = null; btnTour.setAttribute("aria-pressed", "false"); btnTour.firstElementChild.textContent = "▶"; } }
btnTour.addEventListener("click", () => {
  if (tourTimer) return stopTour();
  btnTour.setAttribute("aria-pressed", "true"); btnTour.firstElementChild.textContent = "❚❚";
  let i = current ? current.index : -1;
  const go = () => { i = (i + 1) % stations.length; focusStation(stations[i], true); };
  go(); tourTimer = setInterval(go, 7000);
});

/* ───────────────────────── camera fly-to ───────────────────────── */
const OVERVIEW = { pos: new THREE.Vector3(-1.1, 4.4, 6.0), target: new THREE.Vector3(0.45, 0.7, -0.2) };
let fly = null;
function flyTo(pos, target) {
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), k: 0, dur: reduced ? 0.01 : 1.4 };
}
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
controls.addEventListener("start", () => { fly = null; stopTour(); });

/* view offset so the focused object isn't hidden behind the panel */
let viewOff = { x: 0, y: 0 };
function updateViewOffset(dt) {
  const w = innerWidth, h = innerHeight, mobile = w <= 760;
  const tx = current && !mobile ? Math.min(420, w * 0.3) / 2 : 0;
  const ty = current && mobile ? h * 0.24 : 0;
  viewOff.x += (tx - viewOff.x) * Math.min(1, dt * 5); viewOff.y += (ty - viewOff.y) * Math.min(1, dt * 5);
  camera.setViewOffset(w, h, viewOff.x, viewOff.y, w, h);
}

/* ───────────────────────── picking ───────────────────────── */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pickables = stations.map((s) => s.group);
let hovered = null, downAt = null;
function stationAt(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickables, true)[0];
  let o = hit && hit.object;
  while (o && !o.userData.station) o = o.parent;
  return o ? o.userData.station : null;
}
function setHover(s) {
  if (s === hovered) return;
  if (hovered) { hovered.mats && hovered.mats.forEach((m) => m.emissive.setHex(m.userData.e0 ?? 0)); hovered.pinEl.classList.remove("hot"); }
  hovered = s;
  canvas.classList.toggle("hover", !!s);
  if (s) { s.mats && s.mats.forEach((m) => { if (m.userData.e0 === undefined) m.userData.e0 = m.emissive.getHex(); m.emissive.setHex(0x1a5c4f); }); s.pinEl.classList.add("hot"); }
}
canvas.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") setHover(stationAt(e)); });
canvas.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener("pointerup", (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  const s = stationAt(e); if (s) focusStation(s);
});

/* ───────────────────────── resize + loop ───────────────────────── */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 0.8 ? 55 : 38;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();
camera.position.copy(OVERVIEW.pos).add(new THREE.Vector3(-1.5, 1.2, 2));
controls.target.copy(OVERVIEW.target);
flyTo(OVERVIEW.pos, OVERVIEW.target);
if (innerWidth / innerHeight < 0.8) { OVERVIEW.pos.set(-1.6, 7.2, 9.4); fly.p1.copy(OVERVIEW.pos); }
window.__lab = { busy: () => !!fly };

const v = new THREE.Vector3(), clock = new THREE.Clock();
let screenT = 0, firstFrame = true;
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (fly) {
    fly.k = Math.min(1, fly.k + dt / fly.dur); const e = ease(fly.k);
    camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e);
    if (fly.k >= 1) fly = null;
  }
  controls.update();
  updateLights(dt);
  updateViewOffset(dt);

  // ambient life
  const sm = reduced ? 0.2 : 1;
  swayers.forEach((s) => { s.o.rotation.z = Math.sin(t * 0.9 * sm + s.ph) * s.amp; s.o.rotation.x = Math.cos(t * 0.7 * sm + s.ph) * s.amp * 0.5; });
  animators.forEach((f) => f(t, dt));
  espLed.material.color.setHex(Math.sin(t * 6) > 0.2 ? 0x3ee6c1 : 0x0d3b32);
  speakerLed.material.color.setHex(Math.sin(t * 1.5) > 0 ? 0xffb547 : 0x5a3a12);
  cloud.position.y = 2.25 + Math.sin(t * 0.6) * 0.04; cloud.rotation.y = t * 0.05;
  // sliding door opens while the balcony is focused
  const openZ = slidingPane.userData.closedZ - 0.85, goalZ = current && current.id === "balcony" ? openZ : slidingPane.userData.closedZ;
  slidingPane.position.z += (goalZ - slidingPane.position.z) * Math.min(1, dt * 2.5);

  // printer: CoreXY head traces each layer, bed lowers
  const pr = printer;
  if (pr.p < 1) pr.p += dt / 28; else { pr.hold += dt; if (pr.hold > 3) { pr.p = 0; pr.hold = 0; } }
  const p = Math.min(1, pr.p), layerH = p * pr.OBJH;
  pr.bed.position.y = pr.BED0 - layerH;
  pr.clip.constant = pr.g.position.y + pr.NOZ;       // world-space nozzle height
  const ang = t * 7, rad = 0.032 + 0.018 * Math.sin(p * Math.PI * 1.1);
  pr.head.position.x = p < 1 ? Math.cos(ang) * rad : 0; pr.head.position.z = p < 1 ? Math.sin(ang) * rad : 0;
  pr.gantry.position.z = pr.head.position.z;
  pr.vase.rotation.y = 0;

  // screens (throttled)
  screenT += dt;
  if (screenT > 0.15) { screenT = 0; drawScreen27(t); drawScreen24(t); drawPrinterScreen(p); }

  // systems view packets
  flows.children.forEach((m) => { if (m.material && m.geometry.type === "TubeGeometry") m.material.opacity += ((systemsOn ? 0.55 : 0) - m.material.opacity) * Math.min(1, dt * 4); });
  packets.forEach((pk) => { pk.t = (pk.t + dt * pk.speed) % 1; pk.curve.getPoint(pk.t, pk.s.position); pk.s.visible = systemsOn; });
  if (!systemsOn && flows.children[0].material.opacity < 0.01) flows.visible = false;

  // project pins + flow labels
  const w = innerWidth, h = innerHeight;
  const project = (vec, el, dx = -10, dy = -10) => {
    v.copy(vec).project(camera);
    const behind = v.z > 1;
    el.style.transform = `translate(${((v.x + 1) / 2) * w + dx}px, ${((-v.y + 1) / 2) * h + dy}px)`;
    return behind;
  };
  stations.forEach((s) => s.pinEl.classList.toggle("off", project(s.pinV, s.pinEl) || (systemsOn && s !== current)));
  flowDefs.forEach((f) => project(f.mid, f.el, -30, -12));

  renderer.render(scene, camera);
  if (firstFrame) { firstFrame = false; $("#loader").classList.add("done"); }
  requestAnimationFrame(loop);
}
drawScreen27(0); drawScreen24(0); drawPrinterScreen(0);
requestAnimationFrame(loop);

// deep link: /lab/#printer
function fromHash() { const s = stations.find((o) => "#" + o.id === location.hash); if (s && s !== current) focusStation(s); }
setTimeout(fromHash, 400);
addEventListener("hashchange", fromHash);
