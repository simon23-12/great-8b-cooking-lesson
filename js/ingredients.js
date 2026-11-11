// All ingredients from the "Good food" box + procedural 3D models for each.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const CATS = [
  { id: 'veg', label: 'vegetables' },
  { id: 'meat', label: 'meat' },
  { id: 'dairy', label: 'dairy products', isNew: true },
  { id: 'other', label: 'other' },
];

// how:   'pour' = container tips over the vessel and comes back, 'drop' = goes into the vessel
// chunk: what floats in the pot/pan afterwards
export const INGREDIENTS = {
  bacon:     { name: 'bacon',           cats: ['meat'],         color: 0xc9504a, piece: 0xd36a5f, how: 'drop', chunk: 'cube',  emoji: '🥓' },
  beans:     { name: 'beans',           cats: ['veg', 'other'], color: 0x8a2b20, piece: 0x8a2b20, how: 'pour', chunk: 'round', emoji: '🫘', isNew: true },
  beef:      { name: 'beef',            cats: ['meat'],         color: 0x9e1f1f, piece: 0x7a2a20, how: 'drop', chunk: 'cube',  emoji: '🥩', isNew: true },
  butter:    { name: 'butter',          cats: ['dairy'],        color: 0xf7e08a, piece: 0xf7e08a, how: 'drop', chunk: 'none',  emoji: '🧈' },
  cheese:    { name: 'cheese',          cats: ['dairy'],        color: 0xf5c842, piece: 0xf5c842, how: 'drop', chunk: 'cube',  emoji: '🧀' },
  chicken:   { name: 'chicken',         cats: ['meat'],         color: 0xf1c8a0, piece: 0xf3d2b0, how: 'drop', chunk: 'cube',  emoji: '🍗' },
  curry:     { name: 'curry powder',    cats: ['other'],        color: 0xe0a020, piece: 0xe0a020, how: 'pour', chunk: 'none',  emoji: '🍛', isNew: true, newPart: 'powder' },
  flour:     { name: 'flour',           cats: ['other'],        color: 0xf4f0e6, piece: 0xf8f6f0, how: 'pour', chunk: 'none',  emoji: '🌾', isNew: true },
  garlic:    { name: 'garlic',          cats: ['veg', 'other'], color: 0xf2ead8, piece: 0xf7f1e0, how: 'drop', chunk: 'cube',  emoji: '🧄', isNew: true },
  lentils:   { name: 'lentils',         cats: ['veg', 'other'], color: 0xe07b39, piece: 0xe07b39, how: 'pour', chunk: 'grain', emoji: '🟠', isNew: true },
  muffin:    { name: 'muffin',          cats: ['other'],        color: 0xb5743a, piece: 0xb5743a, how: 'drop', chunk: 'cube',  emoji: '🧁', isNew: true },
  mushrooms: { name: 'mushrooms',       cats: ['veg', 'other'], color: 0xc8a983, piece: 0xe3d1b4, how: 'drop', chunk: 'cube',  emoji: '🍄', isNew: true },
  nuts:      { name: 'nuts',            cats: ['other'],        color: 0xa0703a, piece: 0xb07e46, how: 'pour', chunk: 'round', emoji: '🥜', isNew: true },
  oil:       { name: 'oil',             cats: ['other'],        color: 0xd9c23a, piece: 0xe0c450, how: 'pour', chunk: 'none',  emoji: '🫒', isNew: true, liquid: true },
  onions:    { name: 'onions',          cats: ['veg'],          color: 0xd9a35a, piece: 0xf3ead2, how: 'drop', chunk: 'cube',  emoji: '🧅', isNew: true },
  parsley:   { name: 'parsley',         cats: ['veg', 'other'], color: 0x3a8f2a, piece: 0x3f9a30, how: 'drop', chunk: 'leaf',  emoji: '🌿', isNew: true },
  pepper:    { name: 'pepper',          cats: ['other'],        color: 0x2b2b2b, piece: 0x222222, how: 'pour', chunk: 'none',  emoji: '⚫' },
  peppers:   { name: 'peppers',         cats: ['veg'],          color: 0xd42a1e, piece: 0xd42a1e, how: 'drop', chunk: 'cube',  emoji: '🫑', isNew: true, multi: [0xd42a1e, 0xf2c12e, 0x3f9b2f] },
  pork:      { name: 'pork',            cats: ['meat'],         color: 0xf0a3a0, piece: 0xf0b0a8, how: 'drop', chunk: 'cube',  emoji: '🥩', isNew: true },
  rice:      { name: 'rice',            cats: ['other'],        color: 0xf8f6ee, piece: 0xfbf9f2, how: 'pour', chunk: 'grain', emoji: '🍚', isNew: true },
  salt:      { name: 'salt',            cats: ['other'],        color: 0xffffff, piece: 0xffffff, how: 'pour', chunk: 'none',  emoji: '🧂', isNew: true },
  spinach:   { name: 'spinach',         cats: ['veg'],          color: 0x2f6e2a, piece: 0x2f6e2a, how: 'drop', chunk: 'leaf',  emoji: '🥬', isNew: true },
  spaghetti: { name: 'spaghetti',       cats: ['other'],        color: 0xf2d68a, piece: 0xf2d68a, how: 'drop', chunk: 'pasta', emoji: '🍝' },
  tomatoes:  { name: 'tinned tomatoes', cats: ['veg', 'other'], color: 0xc8281e, piece: 0xc8281e, how: 'pour', chunk: 'none',  emoji: '🥫', isNew: true, liquid: true },
  carrot:    { name: 'carrot',          cats: ['veg'],          color: 0xf07a1a, piece: 0xf07a1a, how: 'drop', chunk: 'cube',  emoji: '🥕' },
};

// Order exactly like the box in the book (+ carrot from the example table)
export const BOX_ORDER = ['bacon', 'beans', 'beef', 'butter', 'cheese', 'chicken', 'curry', 'flour', 'garlic', 'lentils',
  'muffin', 'mushrooms', 'nuts', 'oil', 'onions', 'parsley', 'pepper', 'peppers', 'pork', 'rice', 'salt', 'spinach',
  'spaghetti', 'tomatoes', 'carrot'];

// Table examples from the book are already filled in
export const TABLE_EXAMPLES = { veg: 'carrot', meat: 'bacon', dairy: 'butter', other: 'oil' };
export const SORT_WORDS = BOX_ORDER.filter(k => !Object.values(TABLE_EXAMPLES).includes(k));

// ---------- helpers ----------
export function std(color, o = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? 0.6, metalness: o.m ?? 0, flatShading: !!o.flat,
    transparent: o.op != null, opacity: o.op ?? 1, side: o.side ?? THREE.FrontSide, map: o.map || null,
    depthWrite: o.op != null ? false : true,
  });
}
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const V2 = THREE.Vector2, V3 = THREE.Vector3;
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([x, y]) => new V2(x, y)), seg);
const M = (g, m) => new THREE.Mesh(g, m);

function bowlWith(fill, grainGeo, grainColor, count) {
  const g = new THREE.Group();
  const bowl = M(lathe([[0, 0], [0.28, 0], [0.3, 0.02], [0.42, 0.13], [0.5, 0.29], [0.485, 0.305], [0.41, 0.17], [0.27, 0.06], [0, 0.06]], 36),
    std(0xf4f1ea, { r: 0.3, side: THREE.DoubleSide }));
  g.add(bowl);
  const stripe = M(new THREE.TorusGeometry(0.47, 0.012, 6, 40), std(0x2f6fb5, { r: 0.4 }));
  stripe.rotation.x = Math.PI / 2; stripe.position.y = 0.25; g.add(stripe);
  const dome = M(new THREE.SphereGeometry(0.45, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(fill, { r: 0.85 }));
  dome.scale.y = 0.3; dome.position.y = 0.19; g.add(dome);
  const im = new THREE.InstancedMesh(grainGeo, std(grainColor, { r: 0.55 }), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new V3(1, 1, 1);
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(Math.random()) * 0.42, a = Math.random() * Math.PI * 2;
    const y = 0.19 + 0.135 * Math.sqrt(Math.max(0, 1 - (r / 0.45) ** 2));
    e.set(rnd(0, 6), rnd(0, 6), rnd(0, 6)); q.setFromEuler(e);
    m.compose(new V3(Math.cos(a) * r, y, Math.sin(a) * r), q, one); im.setMatrixAt(i, m);
  }
  g.add(im);
  return g;
}

function pile(color, n, spread, size) { // little heap of specks next to a shaker/jar
  const g = new THREE.Group();
  const cone = M(new THREE.ConeGeometry(spread, spread * 0.5, 18), std(color, { r: 0.95 }));
  cone.position.y = spread * 0.25; g.add(cone);
  const geo = new THREE.SphereGeometry(size, 5, 4), mat = std(color, { r: 0.8 });
  for (let i = 0; i < n; i++) { const s = M(geo, mat); const a = rnd(0, 6.3), r = rnd(spread * 0.8, spread * 1.5); s.position.set(Math.cos(a) * r, size * 0.5, Math.sin(a) * r); g.add(s); }
  return g;
}

// ---------- builders ----------
const B = {
  carrot() {
    const g = new THREE.Group();
    const bodyM = std(0xf07a1a, { r: 0.5 }), leafM = std(0x3f9b2f, { r: 0.7 });
    const mk = () => {
      const c = new THREE.Group();
      const geo = new THREE.ConeGeometry(0.17, 1, 18, 8);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const k = 1 + 0.04 * Math.sin(p.getY(i) * 40); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
      geo.computeVertexNormals();
      const body = M(geo, bodyM); body.rotation.z = Math.PI / 2; c.add(body);
      for (let i = 0; i < 5; i++) {
        const piv = new THREE.Group(); piv.position.x = 0.5;
        const l = M(new THREE.ConeGeometry(0.035, 0.5, 5), leafM); l.position.y = 0.25; piv.add(l);
        piv.rotation.set((i - 2) * 0.35, 0, -Math.PI / 2 + rnd(-0.2, 0.25)); c.add(piv);
      }
      c.position.y = 0.17; return c;
    };
    const a = mk(); a.rotation.y = 0.15; a.position.z = -0.18; g.add(a);
    const b = mk(); b.rotation.y = -0.2; b.position.set(0.1, 0, 0.2); g.add(b);
    return g;
  },
  bacon() {
    const g = new THREE.Group();
    const t = canvasTexture(256, 64, (x, w, h) => {
      const st = [['#b8423c', .26], ['#f3d9c8', .14], ['#c9504a', .2], ['#f6e2d4', .12], ['#a83a35', .28]]; let y = 0;
      for (const [c, f] of st) { x.fillStyle = c; x.fillRect(0, y, w, f * h + 1); y += f * h; }
    });
    const mat = std(0xffffff, { map: t, r: 0.6, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.PlaneGeometry(1.1, 0.24, 30, 1); const p = geo.attributes.position;
      for (let v = 0; v < p.count; v++) p.setZ(v, Math.sin(p.getX(v) * 9 + i * 1.7) * 0.035);
      geo.computeVertexNormals();
      const m = M(geo, mat); m.rotation.x = -Math.PI / 2; m.rotation.z = (i - 1) * 0.12;
      m.position.set(0, 0.04 + i * 0.025, (i - 1) * 0.25); g.add(m);
    }
    return g;
  },
  beef() {
    const g = new THREE.Group();
    const t = canvasTexture(256, 256, (x, w, h) => {
      x.fillStyle = '#a3242a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,232,222,.75)'; x.lineCap = 'round';
      for (let i = 0; i < 16; i++) { x.lineWidth = 1 + Math.random() * 3; x.beginPath(); let px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (Math.random() - .5) * 60; py += (Math.random() - .5) * 60; x.lineTo(px, py); } x.stroke(); }
    });
    const side = std(0x8a2024, { r: 0.6 });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.47, 0.18, 32), [side, std(0xffffff, { map: t, r: 0.5 }), side]);
    m.scale.x = 1.35; m.position.y = 0.09; g.add(m);
    const fat = M(new THREE.CylinderGeometry(0.48, 0.5, 0.16, 32, 1, true, 0, Math.PI * 0.9), std(0xf3e6da, { r: 0.7, side: THREE.DoubleSide }));
    fat.scale.x = 1.35; fat.position.y = 0.09; g.add(fat);
    return g;
  },
  pork() {
    const g = new THREE.Group();
    const t = canvasTexture(128, 128, (x, w, h) => { const gr = x.createRadialGradient(64, 64, 10, 64, 64, 70); gr.addColorStop(0, '#f2a8a2'); gr.addColorStop(1, '#e48d88'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
    const side = std(0xe89892, { r: 0.6 });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 32), [side, std(0xffffff, { map: t, r: 0.45 }), side]);
    m.scale.set(1.25, 1, 0.9); m.position.y = 0.09; g.add(m);
    const fat = M(new THREE.CylinderGeometry(0.47, 0.47, 0.15, 32, 1, true), std(0xfaf0e4, { r: 0.6, side: THREE.DoubleSide }));
    fat.scale.set(1.25, 1, 0.9); fat.position.y = 0.09; g.add(fat);
    const bone = M(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 10), std(0xf6f1e6)); bone.rotation.z = Math.PI / 2; bone.position.set(0.5, 0.09, 0.15); g.add(bone);
    return g;
  },
  chicken() {
    const g = new THREE.Group();
    const meat = std(0xefc29e, { r: 0.45 }), bone = std(0xf6f1e6, { r: 0.4 });
    const mk = () => {
      const d = new THREE.Group();
      d.add(M(lathe([[0, 0.3], [0.07, 0.3], [0.12, 0.38], [0.2, 0.5], [0.25, 0.64], [0.26, 0.75], [0.22, 0.86], [0.13, 0.94], [0, 0.97]]), meat));
      const b = M(new THREE.CylinderGeometry(0.045, 0.05, 0.34, 10), bone); b.position.y = 0.15; d.add(b);
      const k1 = M(new THREE.SphereGeometry(0.06, 10, 8), bone); k1.position.set(0.035, 0, 0); d.add(k1);
      const k2 = k1.clone(); k2.position.x = -0.035; d.add(k2);
      const w = new THREE.Group(); d.rotation.z = Math.PI / 2; w.add(d); w.position.y = 0.26; return w;
    };
    const a = mk(); a.rotation.y = 0.4; a.position.z = -0.2; g.add(a);
    const b = mk(); b.rotation.y = -0.3; b.position.set(0.15, 0, 0.25); g.add(b);
    return g;
  },
  butter() {
    const g = new THREE.Group();
    const dish = M(new THREE.BoxGeometry(1.0, 0.05, 0.6), std(0xf7f7f2, { r: 0.3 })); dish.position.y = 0.025; g.add(dish);
    const bl = M(new THREE.BoxGeometry(0.75, 0.3, 0.38), std(0xf8e38c, { r: 0.3 })); bl.position.y = 0.2; g.add(bl);
    const wr = M(new THREE.BoxGeometry(0.34, 0.32, 0.4), std(0xd9c27a, { r: 0.3, m: 0.6 })); wr.position.set(0.22, 0.2, 0); g.add(wr);
    return g;
  },
  cheese() {
    const g = new THREE.Group();
    const th = Math.PI / 2.6;
    const m = M(new THREE.CylinderGeometry(0.6, 0.6, 0.42, 24, 1, false, 0, th), std(0xf5c842, { r: 0.5 })); m.position.y = 0.21; g.add(m);
    const holeM = std(0xd6a51e, { r: 0.8 });
    for (let i = 0; i < 7; i++) {
      const a = rnd(0.1, th - 0.1), r = rnd(0.15, 0.52);
      const h = M(new THREE.CircleGeometry(rnd(0.03, 0.06), 14), holeM); h.rotation.x = -Math.PI / 2; h.position.set(Math.sin(a) * r, 0.422, Math.cos(a) * r); g.add(h);
    }
    const rind = M(new THREE.CylinderGeometry(0.605, 0.605, 0.42, 24, 1, true, 0, th), std(0xe8a92a, { r: 0.6 })); rind.position.y = 0.21; g.add(rind);
    return g;
  },
  curry() {
    const g = new THREE.Group();
    const pow = M(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 28), std(0xe29a1c, { r: 0.9 })); pow.position.y = 0.24; g.add(pow);
    const jar = M(new THREE.CylinderGeometry(0.26, 0.26, 0.62, 28), std(0xffffff, { r: 0.05, op: 0.3 })); jar.position.y = 0.31; jar.renderOrder = 2; g.add(jar);
    const lid = M(new THREE.CylinderGeometry(0.275, 0.275, 0.12, 28), std(0xb5261a, { r: 0.4 })); lid.position.y = 0.68; g.add(lid);
    const p = pile(0xe29a1c, 6, 0.16, 0.025); p.position.set(0.45, 0, 0.18); g.add(p);
    return g;
  },
  flour() {
    const g = new THREE.Group();
    const paper = std(0xf1ece0, { r: 0.85 });
    const bag = M(new THREE.BoxGeometry(0.55, 0.78, 0.36), paper); bag.position.y = 0.39; g.add(bag);
    const fold = M(new THREE.BoxGeometry(0.55, 0.12, 0.2), paper); fold.position.set(0, 0.82, 0); fold.rotation.x = 0.35; g.add(fold);
    const band = M(new THREE.BoxGeometry(0.565, 0.2, 0.37), std(0x3d6fc0, { r: 0.7 })); band.position.y = 0.42; g.add(band);
    const wheat = M(new THREE.SphereGeometry(0.07, 10, 8), std(0xe2b44a)); wheat.scale.set(0.6, 1.4, 0.3); wheat.position.set(0, 0.62, 0.18); g.add(wheat);
    const p = pile(0xfaf8f2, 5, 0.17, 0.025); p.position.set(0.48, 0, 0.15); g.add(p);
    return g;
  },
  garlic() {
    const g = new THREE.Group();
    const geo = lathe([[0, 0], [0.12, 0.01], [0.25, 0.08], [0.31, 0.2], [0.28, 0.32], [0.17, 0.42], [0.07, 0.5], [0.03, 0.6], [0.015, 0.66], [0, 0.67]], 40);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const a = Math.atan2(z, x); const k = 1 + 0.07 * Math.cos(a * 7); p.setX(i, x * k); p.setZ(i, z * k); }
    geo.computeVertexNormals();
    const mat = std(0xf3ecdc, { r: 0.55 });
    g.add(M(geo, mat));
    const s2 = M(geo, mat); s2.scale.setScalar(0.75); s2.position.set(0.42, 0, 0.12); s2.rotation.z = 0.2; g.add(s2);
    for (let i = 0; i < 2; i++) { const c = M(new THREE.SphereGeometry(0.1, 12, 8), std(0xeee3c8, { r: 0.5 })); c.scale.set(1, 0.6, 0.6); c.position.set(-0.15 + i * 0.5, 0.06, 0.38); c.rotation.y = i; g.add(c); }
    return g;
  },
  lentils() { return bowlWith(0xd8743a, new THREE.CylinderGeometry(0.035, 0.035, 0.014, 8), 0xe58445, 110); },
  rice() { return bowlWith(0xefebdf, new THREE.CapsuleGeometry(0.012, 0.04, 2, 6), 0xffffff, 170); },
  beans() { const geo = new THREE.SphereGeometry(0.05, 10, 8); geo.scale(1.5, 0.8, 0.85); return bowlWith(0x6e2018, geo, 0x8f2d22, 46); },
  nuts() { const geo = new THREE.SphereGeometry(0.06, 10, 8); geo.scale(1.15, 0.9, 1); return bowlWith(0x8a5a2a, geo, 0xa8763c, 40); },
  muffin() {
    const g = new THREE.Group();
    const t = canvasTexture(256, 64, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#e0567a'; x.fillRect(i * w / 16, 0, w / 16 + 1, h); } });
    const cs = M(new THREE.CylinderGeometry(0.34, 0.26, 0.32, 32, 1, true), std(0xffffff, { map: t, r: 0.7, side: THREE.DoubleSide })); cs.position.y = 0.16; g.add(cs);
    const top = M(new THREE.SphereGeometry(0.4, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), std(0xb8783e, { r: 0.85 })); top.scale.y = 0.75; top.position.y = 0.3; g.add(top);
    const chipM = std(0x3b2414, { r: 0.6 });
    for (let i = 0; i < 12; i++) { const a = rnd(0, 6.3), el = rnd(0.2, 1.3); const c = M(new THREE.SphereGeometry(0.03, 6, 5), chipM); c.position.set(Math.cos(a) * Math.cos(el) * 0.4, 0.3 + Math.sin(el) * 0.3, Math.sin(a) * Math.cos(el) * 0.4); g.add(c); }
    return g;
  },
  mushrooms() {
    const g = new THREE.Group();
    const capM = std(0xb08c68, { r: 0.7 }), underM = std(0xe8dcc4, { r: 0.9, side: THREE.DoubleSide }), stemM = std(0xf1e8d8, { r: 0.7 });
    const mk = (s) => {
      const m = new THREE.Group();
      const cap = M(new THREE.SphereGeometry(0.28, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), capM); cap.scale.y = 0.65; cap.position.y = 0.22; m.add(cap);
      const u = M(new THREE.CircleGeometry(0.28, 24), underM); u.rotation.x = Math.PI / 2; u.position.y = 0.221; m.add(u);
      const st = M(new THREE.CylinderGeometry(0.08, 0.1, 0.24, 14), stemM); st.position.y = 0.12; m.add(st);
      m.scale.setScalar(s); return m;
    };
    const a = mk(1); a.position.set(-0.2, 0, -0.1); g.add(a);
    const b = mk(0.8); b.position.set(0.25, 0, 0.15); g.add(b);
    const c = mk(0.75); c.rotation.z = Math.PI / 2 - 0.2; c.position.set(0.0, 0.2, 0.35); g.add(c);
    return g;
  },
  oil() {
    const g = new THREE.Group();
    const b = M(lathe([[0, 0], [0.2, 0], [0.22, 0.03], [0.22, 0.6], [0.17, 0.74], [0.08, 0.86], [0.075, 1.0], [0, 1.0]], 32), std(0xc9b13a, { r: 0.1, op: 0.82 }));
    g.add(b);
    const label = M(new THREE.CylinderGeometry(0.225, 0.225, 0.26, 32, 1, true), std(0x4f6e26, { r: 0.6 })); label.position.y = 0.32; g.add(label);
    const olive = M(new THREE.SphereGeometry(0.06, 12, 8), std(0x9fb03a)); olive.scale.set(1, 1.3, 0.4); olive.position.set(0, 0.32, 0.22); g.add(olive);
    const cap = M(new THREE.CylinderGeometry(0.085, 0.085, 0.1, 16), std(0x2d5a2a, { r: 0.4 })); cap.position.y = 1.03; g.add(cap);
    return g;
  },
  onions() {
    const g = new THREE.Group();
    const geo = lathe([[0, 0], [0.08, 0.01], [0.22, 0.08], [0.31, 0.22], [0.29, 0.36], [0.19, 0.48], [0.07, 0.57], [0.025, 0.66], [0.012, 0.72], [0, 0.73]], 32);
    const a = M(geo, std(0xc98a3c, { r: 0.45 })); a.position.set(-0.25, 0, -0.05); g.add(a);
    const b = M(geo, std(0xd29a4c, { r: 0.45 })); b.scale.setScalar(0.85); b.position.set(0.3, 0, 0.1); b.rotation.z = 0.15; g.add(b);
    const c = M(geo, std(0x8a3358, { r: 0.45 })); c.scale.setScalar(0.8); c.position.set(0.0, 0, 0.42); c.rotation.x = -0.1; g.add(c);
    return g;
  },
  parsley() {
    const g = new THREE.Group(); const b = new THREE.Group();
    const stemM = std(0x6fae4a, { r: 0.6 }), leafM = std(0x2f8a2a, { r: 0.8, flat: true });
    for (let i = 0; i < 7; i++) {
      const piv = new THREE.Group(); piv.rotation.x = (i - 3) * 0.15; piv.rotation.z = rnd(-0.08, 0.08);
      const s = M(new THREE.CylinderGeometry(0.012, 0.016, 0.6, 5), stemM); s.position.y = 0.3; piv.add(s);
      for (let j = 0; j < 4; j++) { const l = M(new THREE.IcosahedronGeometry(0.075, 0), leafM); l.position.set(rnd(-.07, .07), 0.62 + rnd(-.05, .06), rnd(-.07, .07)); l.scale.y = 0.6; piv.add(l); }
      b.add(piv);
    }
    b.rotation.z = -Math.PI / 2 + 0.08; b.position.y = 0.1;
    g.add(b); return g;
  },
  pepper() {
    const g = new THREE.Group();
    g.add(M(lathe([[0, 0], [0.17, 0], [0.17, 0.08], [0.13, 0.18], [0.12, 0.5], [0.15, 0.58], [0.17, 0.68], [0.14, 0.78], [0.08, 0.84], [0, 0.86]]), std(0x4a2c1a, { r: 0.4 })));
    const k = M(new THREE.SphereGeometry(0.045, 12, 8), std(0xcccccc, { m: 0.9, r: 0.25 })); k.position.y = 0.88; g.add(k);
    const p = pile(0x1c1c1c, 9, 0.12, 0.025); p.position.set(0.36, 0, 0.12); g.add(p);
    return g;
  },
  peppers() {
    const g = new THREE.Group();
    const mk = (color) => {
      const m = new THREE.Group();
      const geo = new THREE.SphereGeometry(0.3, 28, 20); const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); const k = 1 + 0.1 * Math.cos(4 * a);
        y *= 1.12; if (y < -0.26) y = -0.26 + (y + 0.26) * 0.3; p.setXYZ(i, x * k, y, z * k);
      }
      geo.computeVertexNormals();
      const body = M(geo, std(color, { r: 0.22 })); body.position.y = 0.28; m.add(body);
      const cal = M(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 12), std(0x2f7a24)); cal.position.y = 0.6; m.add(cal);
      const st = M(new THREE.CylinderGeometry(0.03, 0.045, 0.14, 8), std(0x3f8f2a)); st.position.y = 0.68; st.rotation.z = 0.25; m.add(st);
      return m;
    };
    const a = mk(0xd42a1e); a.position.set(-0.3, 0, -0.1); g.add(a);
    const b = mk(0xf2b81e); b.position.set(0.32, 0, -0.05); b.rotation.y = 1; g.add(b);
    const c = mk(0x3f9b2f); c.scale.setScalar(0.85); c.position.set(0.0, 0, 0.42); g.add(c);
    return g;
  },
  salt() {
    const g = new THREE.Group();
    g.add(M(lathe([[0, 0], [0.16, 0], [0.17, 0.04], [0.14, 0.38], [0.155, 0.46], [0, 0.46]]), std(0xf6f6f2, { r: 0.25 })));
    const top = M(new THREE.SphereGeometry(0.155, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0xd8dade, { m: 0.9, r: 0.25 })); top.scale.y = 0.6; top.position.y = 0.46; g.add(top);
    const holeM = std(0x333333);
    for (let i = 0; i < 5; i++) { const h = M(new THREE.SphereGeometry(0.014, 6, 4), holeM); const a = i * 1.25; h.position.set(Math.cos(a) * 0.05 * (i ? 1 : 0), 0.553, Math.sin(a) * 0.05 * (i ? 1 : 0)); g.add(h); }
    const band = M(new THREE.CylinderGeometry(0.152, 0.152, 0.06, 24, 1, true), std(0x2f6fb5)); band.position.y = 0.22; g.add(band);
    const p = pile(0xffffff, 7, 0.13, 0.022); p.position.set(0.36, 0, 0.12); g.add(p);
    return g;
  },
  spinach() {
    const g = new THREE.Group();
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.2, 0.08, 0.22, 0.42, 0, 0.58); sh.bezierCurveTo(-0.22, 0.42, -0.2, 0.08, 0, 0);
    const geo = new THREE.ShapeGeometry(sh, 12); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.12 * (y / 0.58) ** 2 + 0.6 * x * x); }
    geo.computeVertexNormals();
    for (let i = 0; i < 8; i++) {
      const c = new THREE.Color(0x2f6e2a).lerp(new THREE.Color(0x4f9a3a), Math.random() * 0.5);
      const piv = new THREE.Group(); piv.rotation.y = i * 0.8 + rnd(-.2, .2); piv.position.y = 0.02 + i * 0.018;
      const l = M(geo, std(c, { r: 0.55, side: THREE.DoubleSide })); l.rotation.x = -Math.PI / 2 + 0.12; l.position.z = 0.05; piv.add(l); g.add(piv);
    }
    return g;
  },
  spaghetti() {
    const g = new THREE.Group();
    const n = 46; const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.011, 0.011, 1.2, 5), std(0xf0d488, { r: 0.45 }), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), one = new V3(1, 1, 1);
    for (let i = 0; i < n; i++) { const r = Math.sqrt(Math.random()) * 0.085, a = rnd(0, 6.3); m.compose(new V3(rnd(-.03, .03), 0.1 + Math.sin(a) * r, Math.cos(a) * r), q, one); im.setMatrixAt(i, m); }
    g.add(im);
    const rib = M(new THREE.TorusGeometry(0.095, 0.018, 8, 24), std(0x2f6fb5, { r: 0.5 })); rib.rotation.y = Math.PI / 2; rib.position.set(0.2, 0.1, 0); g.add(rib);
    g.rotation.y = 0.35;
    const w = new THREE.Group(); w.add(g); return w;
  },
  tomatoes() {
    const g = new THREE.Group();
    const label = canvasTexture(512, 128, (x, w, h) => {
      x.fillStyle = '#c8281e'; x.fillRect(0, 0, w, h); x.fillStyle = '#f7efd8'; x.fillRect(0, h * 0.16, w, h * 0.68);
      for (let i = 0; i < 4; i++) {
        const cx = 64 + i * 128, cy = h / 2 + 4;
        x.fillStyle = '#d8321f'; x.beginPath(); x.ellipse(cx, cy, 38, 32, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(cx - 12, cy - 10, 10, 7, -0.5, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#3f8f2a'; x.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; x.lineTo(cx + Math.cos(a) * 14, cy - 30 + Math.sin(a) * 6); x.lineTo(cx + Math.cos(a + 0.6) * 4, cy - 30 + Math.sin(a + 0.6) * 2); } x.fill();
      }
    });
    const metal = std(0xd0d4d8, { m: 0.9, r: 0.3 });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.52, 36), [std(0xffffff, { map: label, r: 0.4 }), metal, metal]); can.position.y = 0.26; g.add(can);
    for (const y of [0.01, 0.51]) { const r = M(new THREE.TorusGeometry(0.3, 0.017, 8, 36), metal); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
    const tab = M(new THREE.TorusGeometry(0.06, 0.012, 6, 16), metal); tab.rotation.x = Math.PI / 2; tab.position.set(0.12, 0.53, 0); g.add(tab);
    return g;
  },
};

const SIZES = { carrot: 1.3, spaghetti: 1.3, bacon: 1.2, oil: 1.1, beef: 1.15, butter: 1.15 };

function normalize(inner, size) {
  inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner); const s = new V3(); box.getSize(s);
  const k = size / Math.max(s.x, s.z, s.y * 0.95);
  inner.scale.multiplyScalar(k); inner.updateMatrixWorld(true);
  box.setFromObject(inner); const c = new V3(); box.getCenter(c);
  inner.position.x -= c.x; inner.position.z -= c.z; inner.position.y -= box.min.y;
  const wrap = new THREE.Group(); wrap.add(inner);
  return wrap;
}

export function buildIngredient(key) {
  const wrap = normalize(B[key](), SIZES[key] ?? 1.1);
  wrap.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  wrap.userData.tap = { ing: key };
  wrap.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(wrap);
  wrap.userData.height = box.max.y;
  return wrap;
}

// chopped pieces that sit on the board
const pieceGeo = new THREE.BoxGeometry(0.13, 0.08, 0.13);
export function makePieces(key) {
  const ing = INGREDIENTS[key]; const g = new THREE.Group();
  const cols = ing.multi || [ing.piece];
  const mats = cols.map(c => std(c, { r: 0.55 }));
  const n = key === 'garlic' ? 9 : 16;
  for (let i = 0; i < n; i++) {
    const m = M(pieceGeo, mats[i % mats.length]); const r = Math.sqrt(Math.random()) * 0.34, a = rnd(0, 6.3);
    m.position.set(Math.cos(a) * r, 0.035, Math.sin(a) * r); m.rotation.set(rnd(-.3, .3), rnd(0, 6), rnd(-.3, .3));
    const s = key === 'garlic' ? 0.6 : rnd(0.75, 1.1); m.scale.setScalar(s); m.castShadow = true; g.add(m);
  }
  g.userData.tap = { ing: key };
  return g;
}

export function disposeObject(o) {
  o.traverse(c => { if (c.geometry && c.geometry !== pieceGeo) c.geometry.dispose(); });
}

// Render a little picture of every ingredient for the tiles
export function makeThumbs(keys, size = 160) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(size, size, false); r.toneMapping = THREE.ACESFilmicToneMapping; r.setClearColor(0x000000, 0);
  const sc = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.5;
  sc.add(new THREE.HemisphereLight(0xffffff, 0x886644, 1.4));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(2, 4, 3); sc.add(d);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
  const out = {}; const dir = new V3(0.25, 0.75, 1).normalize();
  for (const key of keys) {
    const o = buildIngredient(key); sc.add(o); o.rotation.y = -0.35; o.updateMatrixWorld(true);
    const sph = new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere());
    const dist = sph.radius / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) * 0.98;
    cam.position.copy(sph.center).addScaledVector(dir, dist); cam.lookAt(sph.center);
    r.render(sc, cam); out[key] = canvas.toDataURL('image/png');
    sc.remove(o); disposeObject(o);
  }
  pm.dispose(); r.dispose(); r.forceContextLoss();
  return out;
}
