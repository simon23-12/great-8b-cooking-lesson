// The 3D kitchen: counter, cooker, pot, pan, chopping board, plate and all animations.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { INGREDIENTS, buildIngredient, makePieces, canvasTexture, std, disposeObject } from './ingredients.js';

const V3 = THREE.Vector3;
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
export const ease = {
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  lin: t => t,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

const SLOTS = [[3.6, -1.75], [5.0, -1.75], [6.4, -1.75], [3.6, -0.35], [5.0, -0.35], [6.4, -0.35], [3.6, 1.05], [5.0, 1.05], [6.4, 1.05]];
const BOARD = new V3(1.4, 0.12, 0.95);
const PLATE = new V3(1.9, 0, -1.55);
const HOB_Y = 0.08;

const MIX = {
  water: [0x8cc2dd, 1], tomatoes: [0xb8261c, .75], curry: [0xcf7f1a, .55], lentils: [0xd27a3e, .45], spinach: [0x3f7a2c, .4],
  oil: [0xd8b84a, .5], butter: [0xf0d070, .5], beef: [0x6a2a1c, .3], chicken: [0xe8c9a6, .15], pork: [0xe6b5a5, .15],
  rice: [0xf4f1e6, .2], spaghetti: [0xeed79a, .15], beans: [0x7a2a20, .2], cheese: [0xf0d070, .1],
};

const VIEWS = {
  overview: { t: new V3(0.85, 0.3, -0.35), hw: 6.5, hh: 2.9 },
  plate: { t: new V3(1.9, 0.25, -1.5), hw: 1.9, hh: 1.3 },
};

export class Kitchen {
  constructor(canvas) {
    this.canvas = canvas;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    const s = this.scene = new THREE.Scene(); s.background = new THREE.Color(0xf3e3cb);
    const pm = new THREE.PMREMGenerator(r); s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; s.environmentIntensity = 0.55; pm.dispose();
    this.baseFov = 34;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, 1, 0.1, 120);
    this.camDir = new V3(0, 1.3, 1.0).normalize();
    this.view = VIEWS.overview; this.lookCur = this.view.t.clone(); this.camInit = false;
    this.tweens = []; this.particles = []; this.confetti = []; this.items = new Map(); this.parked = [];
    this.time = 0; this.matCache = new Map();
    this.raycaster = new THREE.Raycaster();
    this._lights(); this._room(); this._cooker(); this._board(); this._plate();
  }

  // ---------- setup ----------
  _lights() {
    this.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a50, 0.85));
    const d = new THREE.DirectionalLight(0xfff1dc, 2.3); d.position.set(4, 12, 7); d.castShadow = true;
    d.shadow.mapSize.set(1024, 1024); const c = d.shadow.camera; c.left = -10; c.right = 10; c.top = 8; c.bottom = -8; c.near = 1; c.far = 30;
    d.shadow.bias = -0.0005; d.shadow.normalBias = 0.02; this.scene.add(d);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5); fill.position.set(-6, 5, 4); this.scene.add(fill);
  }
  _room() {
    const s = this.scene;
    const marble = canvasTexture(512, 512, (x, w, h) => {
      x.fillStyle = '#f4efe6'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(150,140,125,${rnd(.05, .18)})`; x.lineWidth = rnd(.5, 2.5); x.beginPath(); let px = rnd(0, w), py = rnd(0, h); x.moveTo(px, py); for (let j = 0; j < 8; j++) { px += rnd(-60, 90); py += rnd(-40, 40); x.lineTo(px, py); } x.stroke(); }
    });
    marble.wrapS = marble.wrapT = THREE.RepeatWrapping; marble.repeat.set(3, 1.2);
    const top = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 6.6), [std(0xe8e0d2, { r: .5 }), std(0xffffff, { map: marble, r: .35 }), std(0xe8e0d2), std(0xe8e0d2), std(0xe8e0d2, { r: .5 }), std(0xe8e0d2)]);
    top.position.set(1, -0.2, -0.1); top.receiveShadow = true; s.add(top);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(17.6, 3, 6), std(0x2aa6a0, { r: .6 })); cab.position.set(1, -1.9, -0.3); s.add(cab);

    const tiles = canvasTexture(256, 256, (x, w, h) => {
      x.fillStyle = '#e9e1d4'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#fbf8f2' : '#f6f1e8'; x.fillRect(i * 128 + 4, j * 128 + 4, 120, 120); }
    });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(20, 7);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), std(0xffffff, { map: tiles, r: .5 }));
    wall.position.set(1, 7, -3.4); wall.receiveShadow = true; s.add(wall);

    // shelf with jars
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(6, 0.14, 0.8), std(0xb88655, { r: .6 })); shelf.position.set(4.5, 2.6, -3.0); shelf.castShadow = true; s.add(shelf);
    const jarCols = [0xe29a1c, 0x8a2b20, 0xf4f0e6, 0x3a8f2a, 0xd8743a];
    jarCols.forEach((c, i) => {
      const g = new THREE.Group();
      const inside = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.55, 20), std(c, { r: .9 })); inside.position.y = 0.3; g.add(inside);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.1, 20), std(0x9a6a3a, { r: .5 })); lid.position.y = 0.62; g.add(lid);
      g.position.set(2.3 + i * 1.1, 2.67, -3.0); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); s.add(g);
    });
    // utensil rail
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4, 10), std(0xcfd3d8, { m: .9, r: .3 })); rail.rotation.z = Math.PI / 2; rail.position.set(-2.6, 2.4, -3.25); s.add(rail);
    const ut = (x, kind) => {
      const g = new THREE.Group(); const metal = std(0xcfd3d8, { m: .9, r: .3 });
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), kind === 'spoon' ? std(0xc08a50) : metal); h.position.y = -0.6; g.add(h);
      const head = kind === 'ladle' ? new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), metal)
        : kind === 'spoon' ? new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), std(0xc08a50)) : new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.03), metal);
      head.position.y = -1.25; if (kind === 'spoon') head.scale.set(1, 1.4, 0.4); g.add(head);
      g.position.set(x, 2.4, -3.2); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); s.add(g);
    };
    ut(-4.0, 'ladle'); ut(-3.1, 'spatula'); ut(-2.2, 'spoon'); ut(-1.3, 'ladle');
    // herb plant
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.7, 20), std(0xc2643a, { r: .8 })); pot.position.set(-6.6, 0.35, -2.3); pot.castShadow = true; s.add(pot);
    const leafM = std(0x3f8f2a, { r: .8, flat: true });
    for (let i = 0; i < 16; i++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.15, .28), 0), leafM); l.position.set(-6.6 + rnd(-.4, .4), 0.85 + rnd(0, .7), -2.3 + rnd(-.4, .4)); l.castShadow = true; s.add(l); }
  }
  _cooker() {
    const s = this.scene;
    const top = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 3.6), std(0x16161b, { r: .12, m: .3 }));
    top.position.set(-2.55, 0.04, -0.6); top.receiveShadow = true; s.add(top);
    this.vessels = { pot: this._vessel('pot', -3.85, -0.75), pan: this._vessel('pan', -1.25, -0.75) };
    this.spoon = new THREE.Group();
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.6, 8), std(0xc08a50, { r: .7 })); h.position.y = 0.8; this.spoon.add(h);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), std(0xc08a50, { r: .7 })); b.scale.set(1, 0.4, 1.4); this.spoon.add(b);
    this.spoon.visible = false; this.spoon.traverse(o => { o.castShadow = true; });
    this.spoonPivot = new THREE.Group(); this.spoonPivot.add(this.spoon); s.add(this.spoonPivot);
  }
  _vessel(kind, x, z) {
    const g = new THREE.Group(); g.position.set(x, HOB_Y, z); this.scene.add(g);
    const v = { kind, x, z, group: g, level: 0, cur: 0, color: new THREE.Color(0x8cc2dd), colorCur: new THREE.Color(0x8cc2dd), watery: false, heat: false, heatCur: 0, chunks: [], stir: 0 };
    const tap = { vessel: kind };
    if (kind === 'pot') {
      const metal = std(0xc9ced6, { m: .9, r: .28, side: THREE.DoubleSide });
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.96, 1.1, 48, 1, true), metal); wall.position.y = 0.55; g.add(wall); wall.userData.tap = tap;
      const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.05, 48), metal); bot.position.y = 0.025; g.add(bot);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.04, 10, 48), metal); rim.rotation.x = Math.PI / 2; rim.position.y = 1.1; g.add(rim);
      for (const side of [1, -1]) { const hd = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 16, Math.PI), std(0x2a2a2e, { r: .5 })); hd.rotation.set(Math.PI / 2, 0, -side * Math.PI / 2); hd.position.set(side * 0.98, 0.92, 0); g.add(hd); }
      v.base = 0.05; v.R = 0.93; v.maxLevel = 0.95;
      const cg = new THREE.CylinderGeometry(0.94, 0.94, 1, 48); cg.translate(0, 0.5, 0); v.contentsGeo = cg;
    } else {
      const dark = std(0x2a2a30, { r: .35, m: .4, side: THREE.DoubleSide });
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.92, 0.3, 48, 1, true), dark); wall.position.y = 0.15; g.add(wall); wall.userData.tap = tap;
      const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.04, 48), dark); bot.position.y = 0.02; g.add(bot); bot.userData.tap = tap;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.03, 8, 48), std(0x55555c, { m: .8, r: .3 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.3; g.add(rim);
      const piv = new THREE.Group(); piv.rotation.y = 0.62; piv.position.y = 0.24; g.add(piv);
      const hd = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.09, 0.17), std(0x1d1d22, { r: .5 })); hd.position.x = 1.05 + 0.6; piv.add(hd);
      v.base = 0.04; v.R = 0.86; v.maxLevel = 0.2;
      const cg = new THREE.CylinderGeometry(0.98, 0.92, 1, 48); cg.translate(0, 0.5, 0); v.contentsGeo = cg;
    }
    v.contents = new THREE.Mesh(v.contentsGeo, new THREE.MeshStandardMaterial({ color: v.colorCur, roughness: 0.2, transparent: true, opacity: 1 }));
    v.contents.position.y = v.base; v.contents.visible = false; v.contents.userData.tap = tap; g.add(v.contents);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    // hob ring + knob
    v.ring = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.045, 8, 48), new THREE.MeshStandardMaterial({ color: 0x3a3030, emissive: 0xff3a10, emissiveIntensity: 0, roughness: .5 }));
    v.ring.rotation.x = -Math.PI / 2; v.ring.position.set(x, HOB_Y + 0.003, z); this.scene.add(v.ring);
    v.knob = new THREE.Group(); v.knob.position.set(x, HOB_Y, 0.85);
    const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 24), std(0xd5d8dc, { m: .8, r: .3 })); kb.position.y = 0.07; kb.castShadow = true; v.knob.add(kb);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.18), std(0xe03a3a)); mark.position.set(0, 0.15, -0.08); v.knob.add(mark);
    v.knob.traverse(o => { o.userData.tap = { knob: kind }; });
    this.scene.add(v.knob);
    v.knobLight = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), new THREE.MeshBasicMaterial({ color: 0x552222 }));
    v.knobLight.rotation.x = -Math.PI / 2; v.knobLight.position.set(x + 0.38, HOB_Y + 0.002, 0.85); this.scene.add(v.knobLight);

    // bubbles + steam pools
    v.bubbles = [];
    const bm = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.1 });
    const bgeo = new THREE.SphereGeometry(kind === 'pot' ? 0.07 : 0.04, 8, 6);
    for (let i = 0; i < (kind === 'pot' ? 26 : 22); i++) { const b = new THREE.Mesh(bgeo, bm); b.visible = false; b.userData = { life: Math.random(), s: rnd(.6, 1.3) }; g.add(b); v.bubbles.push(b); }
    v.steam = [];
    for (let i = 0; i < 22; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this._steamTex(), transparent: true, opacity: 0, depthWrite: false }));
      sp.userData = { life: 1 + Math.random(), speed: rnd(.6, 1.1) }; g.add(sp); v.steam.push(sp);
    }
    return v;
  }
  _steamTex() {
    if (!this.steamTex) this.steamTex = canvasTexture(64, 64, (x, w, h) => { const gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
    return this.steamTex;
  }
  _board() {
    const wood = canvasTexture(512, 256, (x, w, h) => {
      x.fillStyle = '#c89a5e'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(120,80,40,${rnd(.08, .22)})`; x.lineWidth = rnd(1, 3); x.beginPath(); const y = rnd(0, h); x.moveTo(0, y); for (let px = 0; px <= w; px += 32) x.lineTo(px, y + Math.sin(px / 60 + i) * 4); x.stroke(); }
    });
    const b = this.board = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 1.8), [std(0xb0844f), std(0xb0844f), std(0xffffff, { map: wood, r: .7 }), std(0xb0844f), std(0xb0844f), std(0xb0844f)]);
    b.position.set(BOARD.x, 0.06, BOARD.z); b.castShadow = true; b.receiveShadow = true; b.userData.tap = { action: 'board' }; this.scene.add(b);
    const k = this.knife = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.02), std(0xdfe3e8, { m: .95, r: .18 })); k.add(blade);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.06), std(0x1e1e22, { r: .5 })); handle.position.set(-0.7, 0.04, 0); k.add(handle);
    k.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.knifeRestPose = { p: new V3(BOARD.x + 0.25, 0.14, BOARD.z + 0.72), r: new THREE.Euler(-Math.PI / 2, 0, 0.05) };
    this.knifeReadyY = 0.7; this._setKnife(this.knifeRestPose.p, this.knifeRestPose.r);
    this.scene.add(k);
  }
  _setKnife(p, r) { this.knife.position.copy(p); this.knife.rotation.copy(r); }
  _plate() {
    const g = this.plate = new THREE.Group();
    const m = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.55, 0], [0.62, 0.03], [0.9, 0.1], [0.95, 0.13], [0.9, 0.13], [0.6, 0.06], [0, 0.06]].map(([x, y]) => new THREE.Vector2(x, y)), 48), std(0xffffff, { r: .2 }));
    m.castShadow = m.receiveShadow = true; g.add(m);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.012, 6, 48), std(0x2f6fb5)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.125; g.add(rim);
    g.position.copy(PLATE); g.scale.setScalar(0.001); g.visible = false; this.scene.add(g);
  }

  // ---------- animation helpers ----------
  tween(dur, fn, e = ease.inOut) { return new Promise(res => this.tweens.push({ t: 0, dur, fn, e, res })); }
  delay(s) { return this.tween(s, () => { }); }
  fly(obj, to, { height = 1.5, dur = 0.75, spin = 0 } = {}) {
    const from = obj.position.clone(); const ry = obj.rotation.y;
    return this.tween(dur, (e) => { obj.position.lerpVectors(from, to, e); obj.position.y += Math.sin(Math.PI * e) * height; obj.rotation.y = ry + spin * e; });
  }
  mat(color) { if (!this.matCache.has(color)) this.matCache.set(color, std(color, { r: 0.55 })); return this.matCache.get(color); }
  setView(name) { this.view = VIEWS[name]; }

  // ---------- game API ----------
  reset() {
    for (const it of this.items.values()) { this.scene.remove(it.obj); disposeObject(it.obj); if (it.pieces) this.scene.remove(it.pieces); }
    this.items.clear(); this.parked = [];
    for (const v of Object.values(this.vessels)) {
      v.level = v.cur = 0; v.heat = false; v.watery = false; v.stir = 0;
      v.chunks.forEach(c => v.group.remove(c)); v.chunks = [];
    }
    if (this.dish) { this.scene.remove(this.dish); this.dish = null; }
    this.confetti.forEach(c => this.scene.remove(c)); this.confetti = [];
    this.plate.visible = false; this.plate.scale.setScalar(0.001);
    this.spoon.visible = false; this._setKnife(this.knifeRestPose.p, this.knifeRestPose.r);
    this.setView('overview');
  }
  async spawnItem(key, slot) {
    const obj = buildIngredient(key);
    const [sx, sz] = SLOTS[slot % SLOTS.length];
    const home = new V3(sx, 0, sz);
    obj.position.set(10, 4, -0.5); obj.rotation.y = rnd(-0.4, 0.4);
    this.scene.add(obj);
    this.items.set(key, { obj, home, chopped: false, pieces: null, h: obj.userData.height });
    await this.fly(obj, home, { height: 1.6, dur: 0.8, spin: rnd(-1, 1) });
    await this.tween(0.25, e => obj.scale.setScalar(1 + Math.sin(e * Math.PI) * 0.12));
  }
  async toBoard(keys) {
    const n = keys.length;
    const jobs = keys.map((k, i) => {
      const it = this.items.get(k); if (!it) return null;
      const to = new V3(BOARD.x + (i - (n - 1) / 2) * 0.72, BOARD.y, BOARD.z + 0.2);
      it.boardPos = to.clone();
      return this.fly(it.obj, to, { height: 1.2, dur: 0.7 }).then(() => this.tween(0.25, e => it.obj.scale.setScalar(Math.max(0.68, 1 - e * 0.32))));
    });
    // knife up into ready pose
    const k = this.knife; const p0 = k.position.clone(), r0 = k.rotation.clone();
    jobs.push(this.tween(0.5, e => { k.position.lerpVectors(p0, new V3(BOARD.x + 0.9, this.knifeReadyY, BOARD.z + 0.2), e); k.rotation.set(r0.x * (1 - e), 0.5 * e, r0.z * (1 - e)); }));
    await Promise.all(jobs);
  }
  chop(key) {
    const it = this.items.get(key); if (!it) return;
    const k = this.knife, x = it.boardPos.x + rnd(-0.15, 0.15), z = it.boardPos.z;
    const top = this.knifeReadyY, low = BOARD.y + 0.12;
    this.tween(0.22, (e, raw) => { const d = Math.sin(Math.PI * e); k.position.set(x + 0.35, top - (top - low) * d, z); k.rotation.set(0, 0.5, -0.12 * d); }, ease.lin);
    this.tween(0.12, e => it.obj.scale.setScalar(0.68 * (1 - Math.sin(e * Math.PI) * 0.08)));
  }
  toPieces(key) {
    const it = this.items.get(key); if (!it || it.chopped) return;
    const p = makePieces(key); p.position.copy(it.obj.position); this.scene.add(p);
    it.obj.visible = false; it.pieces = p; it.chopped = true;
    p.scale.setScalar(0.3); this.tween(0.25, e => p.scale.setScalar(0.3 + 0.7 * e), ease.back);
  }
  async parkPieces(keys) { // move chopped pieces to the back of the board
    const jobs = [];
    for (const key of keys) {
      const it = this.items.get(key); if (!it || !it.pieces) continue;
      let slot = 0; while (this.parked.includes(slot)) slot++;
      this.parked.push(slot); it.parkSlot = slot;
      const to = new V3(BOARD.x - 1.0 + slot * 0.5, BOARD.y, BOARD.z - 0.55);
      const p = it.pieces;
      jobs.push(this.fly(p, to, { height: 0.4, dur: 0.5 }).then(() => this.tween(0.2, e => p.scale.setScalar(1 - 0.15 * e))));
    }
    await Promise.all(jobs);
  }
  async knifeRest() {
    const k = this.knife; const p0 = k.position.clone(), r0 = k.rotation.clone(); const rp = this.knifeRestPose;
    await this.tween(0.45, e => { k.position.lerpVectors(p0, rp.p, e); k.rotation.set(r0.x + (rp.r.x - r0.x) * e, r0.y * (1 - e), r0.z + (rp.r.z - r0.z) * e); });
  }
  setHeat(vn, on) {
    const v = this.vessels[vn]; v.heat = on;
    v.knobLight.material.color.set(on ? 0xff3a10 : 0x552222);
  }
  surfaceY(v) { return HOB_Y + v.base + Math.max(v.cur, v.level); }
  async pourWater(vn) {
    const v = this.vessels[vn];
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 12), new THREE.MeshStandardMaterial({ color: 0x9fd0ea, transparent: true, opacity: 0.7, roughness: .1 }));
    const topY = 6.5; stream.position.set(v.x, topY, v.z); stream.scale.y = 0.001; this.scene.add(stream);
    const bottom = () => this.surfaceY(v) - 0.2;
    await this.tween(0.35, e => { const y0 = topY, y1 = topY - (topY - bottom()) * e; stream.scale.y = Math.max(0.001, y0 - y1); stream.position.y = (y0 + y1) / 2; });
    this._mixInto(v, 'water');
    for (let i = 0; i < 3; i++) this._splash(v, 0x9fd0ea);
    await this.delay(1.0);
    await this.tween(0.3, e => { const y0 = topY - (topY - bottom()) * e, y1 = bottom(); stream.scale.y = Math.max(0.001, y0 - y1); stream.position.y = (y0 + y1) / 2; });
    this.scene.remove(stream); stream.geometry.dispose();
  }
  async addToVessel(key, vn) {
    const v = this.vessels[vn]; const it = this.items.get(key); const ing = INGREDIENTS[key];
    if (!it) return;
    const surf = () => this.surfaceY(v);
    if (it.chopped && it.pieces) {
      const p = it.pieces;
      if (it.parkSlot != null) { this.parked = this.parked.filter(s => s !== it.parkSlot); it.parkSlot = null; }
      await this.fly(p, new V3(v.x, surf() + 0.35, v.z), { height: 1.6, dur: 0.7 });
      await this.tween(0.15, e => p.scale.setScalar(Math.max(0.01, (1 - e) * p.scale.x)));
      this.scene.remove(p); it.pieces = null;
      this._splash(v); this._mixInto(v, key);
      return;
    }
    const o = it.obj;
    if (ing.how === 'pour') {
      const above = new V3(v.x + 0.8, vn === 'pot' ? 1.95 : 1.25, v.z + 0.05);
      await this.fly(o, above, { height: 0.9, dur: 0.6 });
      const ry = o.rotation.y;
      await this.tween(0.35, e => { o.rotation.set(0, ry * (1 - e), e * 2.0); });
      const emitDur = ing.liquid ? 1.2 : 0.9; let t = 0, mixed = false;
      await this.tween(emitDur, (e) => {
        const p = o.localToWorld(new V3(0, it.h * 0.95, 0));
        const n = ing.liquid ? 3 : 2;
        for (let i = 0; i < n; i++) this._emit(p, ing.piece, surf(), ing.liquid ? 0.05 : 0.03, ing.liquid ? 0.06 : 0.12);
        o.rotation.z = 2.0 + Math.sin(e * 30) * (ing.liquid ? 0.03 : 0.12);
        if (!mixed && e > 0.4) { mixed = true; this._mixInto(v, key); }
      }, ease.lin);
      await this.tween(0.3, e => { o.rotation.z = 2.0 * (1 - e); });
      await this.fly(o, it.home, { height: 0.9, dur: 0.6 });
      o.rotation.set(0, ry, 0);
      return;
    }
    await this.fly(o, new V3(v.x, surf() + 0.25, v.z), { height: 1.8, dur: 0.75, spin: 1.5 });
    const s0 = o.scale.x;
    await this.tween(0.18, e => o.scale.setScalar(Math.max(0.01, s0 * (1 - e))));
    o.visible = false;
    this._splash(v); this._mixInto(v, key);
  }
  async stir(vn) {
    const v = this.vessels[vn];
    const sp = this.spoon, piv = this.spoonPivot;
    piv.position.set(v.x, this.surfaceY(v) - 0.05, v.z);
    sp.position.set(0.45, 0, 0); sp.rotation.set(0, 0, 0.35); sp.visible = true;
    v.stir = 0.6;
    const r0 = piv.rotation.y;
    await this.tween(0.55, e => { piv.rotation.y = r0 + e * Math.PI * 2; }, ease.inOut);
  }
  hideSpoon() { this.spoon.visible = false; }

  async serve(dish) {
    for (const vn of ['pot', 'pan']) this.setHeat(vn, false);
    this.plate.visible = true; this.setView('plate');
    await this.tween(0.6, e => this.plate.scale.setScalar(Math.max(0.001, e)), ease.back);
    const top = new V3(PLATE.x, 0.35, PLATE.z);
    const jobs = [];
    for (const v of Object.values(this.vessels)) {
      if (v.cur < 0.02) continue;
      const blob = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 12), std(v.colorCur.getHex(), { r: .4 }));
      blob.scale.y = 0.5; blob.position.set(v.x, this.surfaceY(v) + 0.1, v.z); this.scene.add(blob);
      v.level = 0; v.chunks.forEach(c => v.group.remove(c)); v.chunks = [];
      jobs.push(this.fly(blob, top, { height: 1.8, dur: 0.9 }).then(() => this.tween(0.2, e => blob.scale.setScalar(Math.max(0.01, 1 - e)))).then(() => this.scene.remove(blob)));
    }
    await Promise.all(jobs);
    this.dish = this._buildDish(dish); this.dish.position.set(PLATE.x, 0.07, PLATE.z); this.dish.scale.setScalar(0.01); this.scene.add(this.dish);
    await this.tween(0.6, e => this.dish.scale.setScalar(Math.max(0.01, e)), ease.back);
    this._confetti();
  }
  _buildDish(d) {
    const g = new THREE.Group();
    const add = (m) => { m.castShadow = true; g.add(m); return m; };
    const bits = (cols, n, r, y, geo) => { for (let i = 0; i < n; i++) { const a = rnd(0, 6.3), rr = Math.sqrt(Math.random()) * r; const m = add(new THREE.Mesh(geo, this.mat(cols[i % cols.length]))); m.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); m.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); } };
    if (d.type === 'pasta') {
      const pm = std(0xf0d488, { r: .45 }); const geos = [0.22, 0.3, 0.38, 0.46].map(r => new THREE.TorusGeometry(r, 0.022, 6, 48));
      for (let i = 0; i < 30; i++) { const m = add(new THREE.Mesh(geos[i % 4], pm)); m.rotation.set(Math.PI / 2 + rnd(-.25, .25), rnd(0, 3), rnd(-.2, .2)); m.position.set(rnd(-.06, .06), 0.06 + rnd(0, .06), rnd(-.06, .06)); m.scale.y = 0.9; }
      const sauce = add(new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 12), std(d.sauce, { r: .3 }))); sauce.scale.set(1, 0.3, 1); sauce.position.y = 0.2;
      bits([d.garnish], 16, 0.25, 0.31, new THREE.BoxGeometry(0.05, 0.015, 0.04));
    } else if (d.type === 'rice') {
      const rice = add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf6f3ea, { r: .9 }))); rice.scale.y = 0.6; rice.position.set(-0.3, 0, -0.05);
      const gr = new THREE.CapsuleGeometry(0.012, 0.035, 2, 5); for (let i = 0; i < 60; i++) { const a = rnd(0, 6.3), el = rnd(0.1, 1.4); const m = add(new THREE.Mesh(gr, this.mat(0xffffff))); m.position.set(-0.3 + Math.cos(a) * Math.cos(el) * 0.4, Math.sin(el) * 0.24, -0.05 + Math.sin(a) * Math.cos(el) * 0.4); m.rotation.set(rnd(0, 3), rnd(0, 3), 0); }
      const sauce = add(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 28), std(d.sauce, { r: .3 }))); sauce.position.set(0.32, 0.04, 0.08);
      const bg = new THREE.BoxGeometry(0.09, 0.06, 0.09); for (let i = 0; i < 16; i++) { const a = rnd(0, 6.3), rr = Math.sqrt(Math.random()) * 0.3; const m = add(new THREE.Mesh(bg, this.mat(d.bits[i % d.bits.length]))); m.position.set(0.32 + Math.cos(a) * rr, 0.1, 0.08 + Math.sin(a) * rr); m.rotation.y = rnd(0, 3); }
    } else {
      const bowl = add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.3, 0], [0.32, 0.02], [0.5, 0.2], [0.62, 0.42], [0.6, 0.44], [0.48, 0.24], [0.3, 0.06], [0, 0.06]].map(([x, y]) => new THREE.Vector2(x, y)), 40), std(0xf7f4ee, { r: .25, side: THREE.DoubleSide })));
      const soup = add(new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), std(d.sauce, { r: .25 }))); soup.rotation.x = -Math.PI / 2; soup.position.y = 0.36;
      bits([d.garnish], 18, 0.35, 0.37, new THREE.BoxGeometry(0.05, 0.012, 0.04));
      bits([0xe07b39, 0xf07a1a], 10, 0.4, 0.365, new THREE.BoxGeometry(0.07, 0.02, 0.07));
    }
    return g;
  }
  _confetti() {
    const cols = [0xe03a3a, 0x2aa6a0, 0xf2c12e, 0x2f6fb5, 0xff8a3d, 0x8bc34a];
    const geo = new THREE.PlaneGeometry(0.08, 0.12);
    for (let i = 0; i < 90; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
      m.position.set(PLATE.x + rnd(-.3, .3), 0.6, PLATE.z + rnd(-.3, .3));
      m.userData = { v: new V3(rnd(-2.2, 2.2), rnd(3, 6), rnd(-1.5, 2.2)), s: new V3(rnd(-8, 8), rnd(-8, 8), rnd(-8, 8)), life: 0 };
      this.scene.add(m); this.confetti.push(m);
    }
  }

  // ---------- particles / contents ----------
  _emit(pos, color, floorY, size, spread) {
    let p = this.particles.find(q => !q.visible);
    if (!p) { p = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.mat(color)); this.scene.add(p); this.particles.push(p); }
    p.material = this.mat(color); p.visible = true; p.scale.setScalar(size * rnd(.7, 1.3));
    p.position.copy(pos).add(new V3(rnd(-spread, spread), 0, rnd(-spread, spread)));
    p.userData = { v: new V3(rnd(-.3, .3), rnd(-1, 0), rnd(-.3, .3)), floor: floorY };
  }
  _splash(v, color) {
    const c = color ?? v.colorCur.getHex(); const y = this.surfaceY(v);
    for (let i = 0; i < 8; i++) {
      let p = this.particles.find(q => !q.visible);
      if (!p) { p = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.mat(c)); this.scene.add(p); this.particles.push(p); }
      p.material = this.mat(c); p.visible = true; p.scale.setScalar(0.05);
      p.position.set(v.x + rnd(-.3, .3), y + 0.05, v.z + rnd(-.3, .3));
      p.userData = { v: new V3(rnd(-1.2, 1.2), rnd(1.5, 3), rnd(-1.2, 1.2)), floor: y - 0.01 };
    }
  }
  _mixInto(v, key) {
    if (key === 'water') {
      if (v.level < 0.03) { v.color.set(0x8cc2dd); v.colorCur.set(0x8cc2dd); v.watery = true; v.level = v.kind === 'pot' ? 0.72 : 0.15; }
      else { v.color.lerp(new THREE.Color(0xe9cf9e), 0.25); v.level = Math.min(v.maxLevel, v.level + 0.5); }
      return;
    }
    const ing = INGREDIENTS[key];
    const [col, w] = MIX[key] || [ing.piece, 0.07];
    if (v.level < 0.01) { v.color.set(col); v.colorCur.set(col); v.watery = false; } else v.color.lerp(new THREE.Color(col), w);
    if (w >= 0.3 && !['oil', 'butter'].includes(key)) v.watery = false;
    const pot = v.kind === 'pot';
    if (key === 'oil' || key === 'butter') v.level = Math.max(v.level, pot ? 0.05 : 0.035);
    else if (key === 'tomatoes') v.level += pot ? 0.18 : 0.07;
    else if (ing.how === 'pour' && ing.chunk === 'none') v.level += 0.0;
    else v.level += pot ? 0.03 : 0.02;
    v.level = Math.min(v.maxLevel, v.level);
    this._spawnChunks(v, key);
  }
  _spawnChunks(v, key) {
    const ing = INGREDIENTS[key]; const type = ing.chunk; if (type === 'none') return;
    if (!this.cg) this.cg = {
      pasta: new THREE.CylinderGeometry(0.014, 0.014, 0.9, 5), grain: new THREE.CapsuleGeometry(0.014, 0.03, 2, 5),
      round: new THREE.SphereGeometry(0.05, 8, 6), leaf: new THREE.SphereGeometry(0.08, 8, 4), cube: new THREE.BoxGeometry(0.1, 0.06, 0.1),
    };
    const n = { pasta: 16, grain: 45, round: 14, leaf: key === 'parsley' ? 18 : 12, cube: 10 }[type];
    const cols = ing.multi || [ing.piece];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.cg[type], this.mat(cols[i % cols.length]));
      const r = Math.sqrt(Math.random()) * v.R * 0.85, a = rnd(0, 6.3);
      m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      if (type === 'pasta') m.rotation.set(Math.PI / 2, 0, rnd(0, 6.3));
      else if (type === 'leaf') { m.scale.set(1, 0.15, key === 'parsley' ? 0.5 : 0.7); if (key === 'parsley') m.scale.multiplyScalar(0.5); m.rotation.y = rnd(0, 6); }
      else m.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
      if (type === 'pasta') m.rotation.order = 'YXZ', m.rotation.set(Math.PI / 2, rnd(0, 6.3), 0);
      m.userData = { h: rnd(0.005, 0.02), ph: rnd(0, 6.3), r, a };
      m.castShadow = false; v.group.add(m); v.chunks.push(m);
    }
    while (v.chunks.length > 120) v.group.remove(v.chunks.shift());
  }

  // ---------- picking ----------
  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const p = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(p, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const h of hits) {
      let o = h.object; if (!o.visible) continue;
      while (o) { if (o.userData && o.userData.tap) return o.userData.tap; o = o.parent; }
    }
    return null;
  }

  // ---------- frame ----------
  resize(w, h) {
    this.W = w; this.H = h; this.renderer.setSize(w, h, false); this._applySafe();
  }
  // Keep the kitchen inside the part of the canvas that is not covered by cards (px margins)
  setSafe(s) { this.safe = s; this._applySafe(); }
  _applySafe() {
    const W = this.W || 1, H = this.H || 1, s = this.safe || { l: 0, t: 0, r: 0, b: 0 };
    const sw = Math.max(80, W - s.l - s.r), sh = Math.max(80, H - s.t - s.b);
    const cx = s.l + sw / 2, cy = s.t + sh / 2;
    const dx = cx - W / 2, dy = cy - H / 2;
    const fw = W + 2 * Math.abs(dx), fh = H + 2 * Math.abs(dy);
    const cam = this.camera;
    cam.aspect = fw / fh;
    cam.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(this.baseFov / 2)) * fh / H));
    cam.setViewOffset(fw, fh, fw / 2 - cx, fh / 2 - cy, W, H);
    cam.updateProjectionMatrix();
    this.fit = { sw, sh, H };
  }
  update(dt) {
    this.time += dt; const t = this.time;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur);
      tw.fn(tw.e(k), k); if (k >= 1) { this.tweens.splice(i, 1); tw.res(); }
    }
    for (const v of Object.values(this.vessels)) this._updateVessel(v, dt, t);
    for (const p of this.particles) {
      if (!p.visible) continue; const u = p.userData;
      u.v.y -= 9.8 * dt; p.position.addScaledVector(u.v, dt);
      if (p.position.y < u.floor && u.v.y < 0) p.visible = false;
    }
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i], u = c.userData; u.life += dt;
      u.v.y -= 6 * dt; u.v.multiplyScalar(0.985); c.position.addScaledVector(u.v, dt);
      c.rotation.x += u.s.x * dt; c.rotation.y += u.s.y * dt;
      if (c.position.y < 0.02) { c.position.y = 0.02; u.v.set(0, 0, 0); u.s.set(0, 0, 0); }
      if (u.life > 6) { this.scene.remove(c); this.confetti.splice(i, 1); }
    }
    // camera
    const cam = this.camera, v = this.view; const tanv = Math.tan(THREE.MathUtils.degToRad(this.baseFov / 2));
    const f = this.fit || { sw: 1, sh: 1, H: 1 };
    const d = Math.max(v.hh * f.H / (f.sh * tanv), v.hw * f.H / (f.sw * tanv));
    const want = v.t.clone().addScaledVector(this.camDir, d); want.x += Math.sin(t * 0.25) * 0.15;
    const k = this.camInit ? 1 - Math.exp(-dt * 2.5) : 1; this.camInit = true;
    cam.position.lerp(want, k); this.lookCur.lerp(v.t, k); cam.lookAt(this.lookCur);
    this.renderer.render(this.scene, cam);
  }
  _updateVessel(v, dt, t) {
    v.cur += (v.level - v.cur) * Math.min(1, dt * 2.5);
    v.colorCur.lerp(v.color, Math.min(1, dt * 2));
    const c = v.contents; c.visible = v.cur > 0.004; c.scale.y = Math.max(0.001, v.cur);
    c.material.color.copy(v.colorCur); c.material.opacity = v.watery ? 0.8 : 1;
    v.heatCur += ((v.heat ? 1 : 0) - v.heatCur) * Math.min(1, dt * 1.5);
    v.ring.material.emissiveIntensity = v.heatCur * 2.4;
    v.knob.rotation.y = -v.heatCur * 2.2;
    const surf = v.base + v.cur;
    v.boiling = v.heatCur > 0.5 && v.cur > 0.02;
    const liquidish = v.kind === 'pot' || v.cur > 0.08;
    for (const b of v.bubbles) {
      const u = b.userData;
      if (!v.boiling) { b.visible = false; continue; }
      u.life += dt * (v.kind === 'pot' ? 1.4 : 3) * u.s;
      if (u.life > 1) { u.life = 0; const r = Math.sqrt(Math.random()) * v.R * 0.9, a = rnd(0, 6.3); u.x = Math.cos(a) * r; u.z = Math.sin(a) * r; }
      const L = u.life; const sc = (L < 0.8 ? L / 0.8 : (1 - L) * 5) * u.s * (liquidish ? 1 : 0.6);
      b.visible = true; b.scale.setScalar(Math.max(0.01, sc)); b.position.set(u.x ?? 0, surf + 0.005, u.z ?? 0);
    }
    for (const sp of v.steam) {
      const u = sp.userData; u.life += dt * 0.5 * u.speed;
      if (u.life >= 1) {
        if (!v.boiling || Math.random() > 0.08) { sp.material.opacity = 0; continue; }
        u.life = 0; const r = Math.random() * v.R * 0.7, a = rnd(0, 6.3); sp.position.set(Math.cos(a) * r, surf + 0.1, Math.sin(a) * r);
      }
      sp.position.y += dt * 0.9 * u.speed; sp.position.x += Math.sin(t * 2 + u.speed * 10) * dt * 0.1;
      const s = 0.4 + u.life * 1.4; sp.scale.set(s, s, s);
      sp.material.opacity = Math.sin(Math.PI * Math.min(1, u.life)) * (v.kind === 'pot' ? 0.42 : 0.3);
    }
    if (v.stir > 0) v.stir = Math.max(0, v.stir - dt);
    for (const ch of v.chunks) {
      const u = ch.userData;
      if (v.stir > 0) { u.a += dt * 6; ch.position.x = Math.cos(u.a) * u.r; ch.position.z = Math.sin(u.a) * u.r; }
      else if (v.boiling) { u.a += dt * 0.25; ch.position.x = Math.cos(u.a) * u.r; ch.position.z = Math.sin(u.a) * u.r; }
      ch.position.y = surf + u.h + (v.boiling ? Math.sin(t * 6 + u.ph) * 0.012 : 0);
    }
  }
}
