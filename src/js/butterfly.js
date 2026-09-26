// Procedural geometry for the automaton: gears, thorax, head, abdomen, legs and wings.
// Nothing is loaded from a model file; every part is generated from curves and shapes.
import * as THREE from 'three';

export function createMaterials() {
  return {
    brass: new THREE.MeshStandardMaterial({ color: '#c9a15a', metalness: 1, roughness: 0.28 }),
    brassDark: new THREE.MeshStandardMaterial({ color: '#8a6a32', metalness: 1, roughness: 0.4 }),
    copper: new THREE.MeshStandardMaterial({ color: '#c07445', metalness: 1, roughness: 0.3 }),
    steel: new THREE.MeshStandardMaterial({ color: '#2b3038', metalness: 1, roughness: 0.32, side: THREE.DoubleSide }),
    blued: new THREE.MeshStandardMaterial({ color: '#1f3b6e', metalness: 1, roughness: 0.22 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: '#b3122e', emissive: '#ff2244', emissiveIntensity: 0.9, roughness: 0.05, metalness: 0, clearcoat: 1 }),
    eye: new THREE.MeshPhysicalMaterial({ color: '#0c3a36', emissive: '#27f0d2', emissiveIntensity: 1.6, roughness: 0.08, metalness: 0.2, clearcoat: 1, flatShading: true }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#bfe8ff', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.16, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }),
    core: new THREE.MeshBasicMaterial({ color: '#ffae4a' }),
  };
}

const UP = new THREE.Vector3(0, 1, 0);
function rod(a, b, r, mat, seg = 10) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.clone().normalize());
  return m;
}
function ball(p, r, mat, seg = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.position.copy(p);
  return m;
}
function tube(points, r, mat, closed = false, seg = 64) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 8, closed), mat);
}
function anchor(parent, x, y, z) {
  const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o;
}

/* Spur gear: trapezoid teeth on a pitch circle of radius teeth·m/2, spoke windows and a ruby jewel. */
export function makeGear(M, teeth, m, depth, mat, withJewel = true) {
  const rp = teeth * m / 2, ra = rp + m, rd = rp - 1.25 * m;
  const s = (Math.PI * 2) / teeth;
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a = i * s;
    const pts = [[rd, a], [ra, a + 0.2 * s], [ra, a + 0.45 * s], [rd, a + 0.65 * s], [rd, a + 0.83 * s]];
    pts.forEach(([r, t], k) => {
      const x = r * Math.cos(t), y = r * Math.sin(t);
      if (i === 0 && k === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const holeR = Math.max(rd * 0.12, 0.012);
  const hole = new THREE.Path(); hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  if (rd > 0.07) {
    const n = teeth > 14 ? 6 : 5;
    const r1 = Math.max(holeR * 2.4, rd * 0.3), r2 = rd * 0.76, spokeW = rd * 0.16;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2 + spokeW / r1 / 2, a1 = ((k + 1) / n) * Math.PI * 2 - spokeW / r1 / 2;
      const b0 = (k / n) * Math.PI * 2 + spokeW / r2 / 2, b1 = ((k + 1) / n) * Math.PI * 2 - spokeW / r2 / 2;
      const p = new THREE.Path();
      p.moveTo(r1 * Math.cos(a0), r1 * Math.sin(a0));
      p.lineTo(r2 * Math.cos(b0), r2 * Math.sin(b0));
      p.absarc(0, 0, r2, b0, b1, false);
      p.lineTo(r1 * Math.cos(a1), r1 * Math.sin(a1));
      p.absarc(0, 0, r1, a1, a0, true);
      shape.holes.push(p);
    }
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, curveSegments: 10, bevelEnabled: true,
    bevelThickness: depth * 0.18, bevelSize: m * 0.12, bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(holeR * 1.9, holeR * 1.9, depth * 1.8, 16), M.steel);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  if (withJewel) g.add(ball(new THREE.Vector3(0, 0, -depth * 0.95), holeR * 1.1, M.ruby, 12));
  g.userData = { rp, teeth, step: s };
  return g;
}

/* ---------- wing outlines ---------- */
function foreShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.15);
  s.bezierCurveTo(0.6, 0.55, 1.6, 1.05, 2.6, 1.25);
  s.bezierCurveTo(3.0, 1.32, 3.15, 1.0, 2.95, 0.6);
  s.bezierCurveTo(2.7, 0.05, 2.3, -0.35, 1.7, -0.45);
  s.bezierCurveTo(1.1, -0.5, 0.45, -0.25, 0, -0.1);
  s.closePath();
  return s;
}
function hindShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.02);
  s.bezierCurveTo(0.7, 0.05, 1.6, -0.15, 2.0, -0.55);
  s.bezierCurveTo(2.35, -0.95, 2.2, -1.5, 1.8, -1.8);
  s.bezierCurveTo(1.5, -2.0, 1.25, -2.05, 1.08, -2.45);
  s.bezierCurveTo(1.02, -2.72, 0.84, -2.74, 0.82, -2.45);
  s.bezierCurveTo(0.75, -2.0, 0.4, -1.3, 0.12, -0.5);
  s.bezierCurveTo(0.04, -0.3, 0, -0.15, 0, -0.02);
  return s;
}

/* Paints the membrane (colour + emissive) into canvases mapped to the wing's bounding box. */
function wingPainter(shape, dial, eyes) {
  const pts = shape.getPoints(80);
  const bb = new THREE.Box2().setFromPoints(pts);
  bb.expandByScalar(0.03);
  const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
  const W = 1024, H = Math.round(Math.min(1024, Math.max(256, W * h / w)));
  const ppu = W / w;
  const px = (x, y) => [(x - bb.min.x) / w * W, (1 - (y - bb.min.y) / h) * H];
  const root = px(0, 0);
  const outline = c => { c.beginPath(); pts.forEach((p, i) => { const [x, y] = px(p.x, p.y); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };

  const hex = document.createElement('canvas'); hex.width = W; hex.height = H;
  {
    const c = hex.getContext('2d');
    const s = 0.11 * ppu, hw = Math.sqrt(3) * s;
    c.strokeStyle = '#fff'; c.lineWidth = 1.6;
    c.beginPath();
    for (let row = -1; row * 1.5 * s < H + s; row++) for (let col = -1; col * hw < W + hw; col++) {
      const cx = col * hw + (row % 2 ? hw / 2 : 0), cy = row * 1.5 * s;
      for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 30); const x = cx + s * 0.92 * Math.cos(a), y = cy + s * 0.92 * Math.sin(a); k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.closePath();
    }
    c.stroke();
    c.globalCompositeOperation = 'destination-in';
    const g = c.createRadialGradient(root[0], root[1], 0, root[0], root[1], Math.max(W, H));
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.35, 'rgba(0,0,0,0.15)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // tint helper: recolour the white hex lattice
  const tinted = document.createElement('canvas'); tinted.width = W; tinted.height = H;
  function hexIn(color) {
    const c = tinted.getContext('2d');
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H); c.drawImage(hex, 0, 0);
    c.globalCompositeOperation = 'source-in'; c.fillStyle = color; c.fillRect(0, 0, W, H);
    return tinted;
  }

  function drawDial(c, color, strong) {
    const [cx, cy] = px(dial.x, dial.y);
    const R = dial.r * ppu;
    c.save();
    c.strokeStyle = color; c.fillStyle = color;
    c.lineWidth = strong ? 3 : 2.5;
    [1, 0.86, 0.3].forEach(k => { c.beginPath(); c.arc(cx, cy, R * k, 0, Math.PI * 2); c.stroke(); });
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2, L = i % 5 === 0 ? 0.12 : 0.05;
      c.lineWidth = i % 5 === 0 ? 3 : 1.5;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86); c.lineTo(cx + Math.cos(a) * R * (0.86 - L), cy + Math.sin(a) * R * (0.86 - L)); c.stroke();
    }
    c.font = `${Math.round(R * 0.16)}px "Marcellus SC", Georgia, serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    [['XII', -Math.PI / 2], ['III', 0], ['VI', Math.PI / 2], ['IX', Math.PI]].forEach(([t, a]) => c.fillText(t, cx + Math.cos(a) * R * 0.58, cy + Math.sin(a) * R * 0.58));
    c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(-2.1) * R * 0.45, cy + Math.sin(-2.1) * R * 0.45); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(-0.5) * R * 0.7, cy + Math.sin(-0.5) * R * 0.7); c.stroke();
    c.restore();
  }

  const col = document.createElement('canvas'); col.width = W; col.height = H;
  const glo = document.createElement('canvas'); glo.width = W; glo.height = H;
  const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const emap = new THREE.CanvasTexture(glo); emap.colorSpace = THREE.SRGBColorSpace; emap.anisotropy = 8;

  function paint(p) {
    let c = col.getContext('2d');
    c.clearRect(0, 0, W, H);
    c.save(); outline(c); c.clip();
    const g = c.createRadialGradient(root[0], root[1], 0, root[0], root[1], Math.max(W, H) * 1.05);
    [0, 0.35, 0.7, 1].forEach((t, i) => g.addColorStop(t, p.stops[i]));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = p.hex; c.drawImage(hexIn(p.dial), 0, 0); c.globalAlpha = 1;
    outline(c); c.lineWidth = 0.22 * ppu; c.strokeStyle = p.band; c.stroke();
    outline(c); c.lineWidth = 0.1 * ppu; c.strokeStyle = p.bandDark; c.stroke();
    eyes.forEach(e => {
      const [x, y] = px(e.x, e.y), r = e.r * ppu;
      const eg = c.createRadialGradient(x, y, 0, x, y, r);
      eg.addColorStop(0, p.eye[0]); eg.addColorStop(0.3, p.eye[1]); eg.addColorStop(0.55, p.eye[2]); eg.addColorStop(0.75, p.eye[3]); eg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = eg; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    });
    drawDial(c, p.dial, false);
    c.restore();

    c = glo.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save(); outline(c); c.clip();
    c.globalAlpha = 0.5; c.drawImage(hexIn('#ffffff'), 0, 0); c.globalAlpha = 1;
    drawDial(c, p.glowLine, true);
    eyes.forEach(e => { const [x, y] = px(e.x, e.y); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, e.r * ppu * 0.18, 0, Math.PI * 2); c.fill(); });
    c.restore();
    map.needsUpdate = true; emap.needsUpdate = true;
  }
  return { map, emap, bb, paint };
}

/* ---------- the whole specimen ---------- */
export function buildButterfly(M, wingPalette) {
  const bug = new THREE.Group();
  const gears = [];      // { obj, axis, phase, ratio, osc? }
  const wings = [];      // { pivot, kind, holder, base, side }
  const painters = [];   // { paint, material }
  const anchors = {};
  const explode = [];    // { obj, base: Vector3, dir: Vector3 }

  /* thorax */
  const TX = 0.34, TY = 0.3, TZ = 0.55;
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.steel);
  hull.scale.set(TX, TY, TZ);
  bug.add(hull);
  const domeG = new THREE.Group(); bug.add(domeG);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.glass);
  dome.scale.set(TX, TY * 0.75, TZ); dome.renderOrder = 5;
  domeG.add(dome);
  anchors.dome = anchor(domeG, 0.1, TY * 0.75, 0.25);
  explode.push({ obj: domeG, base: domeG.position.clone(), dir: new THREE.Vector3(0, 1.3, 0) });

  const rimPts = [];
  for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; rimPts.push(new THREE.Vector3(TX * Math.cos(a), 0, TZ * Math.sin(a))); }
  bug.add(tube(rimPts, 0.022, M.brass, true, 128));
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    bug.add(ball(new THREE.Vector3(TX * 1.02 * Math.cos(a), -0.03, TZ * 1.02 * Math.sin(a)), 0.014, M.brassDark, 8));
  }
  [-0.32, 0, 0.32].forEach(z => {
    const k = Math.sqrt(1 - (z / TZ) ** 2), pts = [];
    for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; pts.push(new THREE.Vector3(TX * k * 1.02 * Math.cos(a), TY * k * 1.02 * Math.sin(a), z)); }
    bug.add(tube(pts, 0.012, M.brass, false, 32));
  });
  const core = ball(new THREE.Vector3(0, -0.1, 0), 0.11, M.core, 24);
  bug.add(core);
  anchors.core = anchor(bug, 0.0, -0.16, 0.0);
  const coreLight = new THREE.PointLight('#ff9a3a', 2.5, 2.5, 2);
  coreLight.position.set(0, -0.05, 0);
  bug.add(coreLight);

  /* gear train: axes vertical, meshed along the body axis (module 0.022) */
  const train = new THREE.Group(); bug.add(train);
  explode.push({ obj: train, base: train.position.clone(), dir: new THREE.Vector3(0, 0.75, 0) });
  const mG = 0.022;
  const flatGear = (teeth, mat, depth = 0.035) => {
    const g = makeGear(M, teeth, mG, depth, mat);
    const holder = new THREE.Group();
    g.rotation.x = -Math.PI / 2;
    holder.add(g);
    return holder;
  };
  const gA = flatGear(16, M.brass); gA.position.set(0, 0.03, 0);
  const gB = flatGear(10, M.copper); gB.position.set(0, 0.03, (16 + 10) * mG / 2);
  const gC = flatGear(12, M.brass); gC.position.set(0, 0.03, -(16 + 12) * mG / 2);
  const gA2 = flatGear(8, M.blued, 0.03); gA2.position.set(0, 0.075, 0);
  [gA, gB, gC, gA2].forEach(g => train.add(g));
  const sA = Math.PI * 2 / 16, sB = Math.PI * 2 / 10, sC = Math.PI * 2 / 12;
  // Phases put a tooth of A into a gap of B and C at the contact points.
  gears.push({ obj: gA, axis: 'y', phase: -Math.PI / 2 - 0.325 * sA, ratio: 1, id: 'A' });
  gears.push({ obj: gA2, axis: 'y', phase: -Math.PI / 2 - 0.325 * sA, ratio: 1 });
  gears.push({ obj: gB, axis: 'y', phase: Math.PI / 2 - 0.825 * sB, ratio: -16 / 10, id: 'B' });
  gears.push({ obj: gC, axis: 'y', phase: -Math.PI / 2 - 0.825 * sC, ratio: -16 / 12, id: 'C' });
  anchors.train = anchor(train, 0.1, 0.06, -0.42);
  {
    const pts = [];
    for (let i = 0; i <= 160; i++) { const t = i / 160, a = t * Math.PI * 8, r = 0.02 + t * 0.075; pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a))); }
    const spring = tube(pts, 0.004, M.blued, false, 320);
    spring.position.y = 0.105;
    train.add(spring);
    gears.push({ obj: spring, axis: 'y', phase: 0, ratio: 0, osc: true });
    anchors.spring = anchor(train, -0.1, 0.11, 0.12);
  }

  /* head */
  const HZ = 0.74;
  const head = new THREE.Group(); head.position.set(0, 0.02, HZ); bug.add(head);
  explode.push({ obj: head, base: head.position.clone(), dir: new THREE.Vector3(0, 0.15, 0.85) });
  head.add(ball(new THREE.Vector3(), 0.19, M.steel, 32));
  const neck = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 12, 40), M.brass);
  neck.position.z = -0.14; head.add(neck);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.015, 10, 40), M.brass);
  band.rotation.y = Math.PI / 2; head.add(band);
  [-1, 1].forEach(sx => {
    const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), M.eye);
    e.position.set(sx * 0.14, 0.04, 0.07); head.add(e);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 32), M.brass);
    bezel.position.set(sx * 0.12, 0.035, 0.055); bezel.lookAt(new THREE.Vector3(sx * 2, 0.4, 0.8).add(bezel.position)); head.add(bezel);
    const base = new THREE.Vector3(sx * 0.06, 0.16, 0.07);
    const pts = [base, new THREE.Vector3(sx * 0.16, 0.6, 0.35), new THREE.Vector3(sx * 0.34, 1.0, 0.85), new THREE.Vector3(sx * 0.55, 1.18, 1.35)];
    const curve = new THREE.CatmullRomCurve3(pts);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.011, 6), M.brassDark));
    for (let i = 1; i < 14; i++) head.add(ball(curve.getPoint(i / 14), 0.02, M.brass, 8));
    const tip = curve.getPoint(1);
    head.add(ball(tip, 0.05, M.copper, 16));
    head.add(ball(tip.clone().add(new THREE.Vector3(0, 0.02, 0.03)), 0.018, M.ruby, 10));
    if (sx > 0) { anchors.antenna = anchor(head, tip.x, tip.y, tip.z); anchors.eye = anchor(head, 0.22, 0.04, 0.1); }
  });
  {
    const pts = [];
    for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 5, r = 0.09 * (1 - t) + 0.012; pts.push(new THREE.Vector3(0, -0.17 - r * Math.cos(a) + 0.09, 0.2 + r * Math.sin(a))); }
    head.add(tube(pts, 0.009, M.brass, false, 200));
    anchors.proboscis = anchor(head, 0, -0.2, 0.22);
  }

  /* abdomen: a chain of nested segments so a small bend per joint accumulates into a curl */
  const abdomen = [];
  {
    let parent = bug;
    const n = 9, len = 0.2;
    for (let i = 0; i < n; i++) {
      const seg = new THREE.Group();
      seg.position.set(0, i === 0 ? -0.02 : 0, i === 0 ? -0.48 : -len);
      const r0 = 0.25 * (1 - i / (n + 2.5)), r1 = 0.25 * (1 - (i + 1) / (n + 2.5));
      const geo = new THREE.CylinderGeometry(r0, r1 * 1.02, len * 0.96, 28, 1);
      geo.rotateX(Math.PI / 2);
      const body = new THREE.Mesh(geo, i % 2 ? M.steel : M.brassDark);
      body.position.z = -len / 2;
      seg.add(body);
      seg.add(new THREE.Mesh(new THREE.TorusGeometry(r0 * 1.02, 0.014, 8, 36), M.brass));
      if (i % 2 === 0) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; seg.add(ball(new THREE.Vector3(r0 * 0.97 * Math.cos(a), r0 * 0.97 * Math.sin(a), -len * 0.5), 0.012, M.brass, 6)); }
      parent.add(seg);
      abdomen.push(seg);
      parent = seg;
    }
    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 16).rotateX(-Math.PI / 2), M.copper);
    stinger.position.z = -0.29; abdomen[n - 1].add(stinger);
    explode.push({ obj: abdomen[0], base: abdomen[0].position.clone(), dir: new THREE.Vector3(0, -0.1, -0.85) });
    anchors.abdomen = anchor(abdomen[4], 0.14, 0.05, -0.1);
  }

  /* legs */
  const legs = new THREE.Group(); bug.add(legs);
  explode.push({ obj: legs, base: legs.position.clone(), dir: new THREE.Vector3(0, -0.7, 0) });
  [-1, 1].forEach(sx => {
    [0.28, 0.02, -0.26].forEach((z, i) => {
      const a = new THREE.Vector3(sx * 0.16, -0.22, z);
      const b = new THREE.Vector3(sx * 0.46, -0.2 + i * 0.02, z + 0.12 - i * 0.12);
      const c = new THREE.Vector3(sx * 0.62, -0.62, z + 0.28 - i * 0.26);
      legs.add(rod(a, b, 0.016, M.steel), rod(b, c, 0.011, M.brass));
      legs.add(ball(a, 0.03, M.brass, 10), ball(b, 0.026, M.copper, 10), ball(c, 0.018, M.brass, 8));
      if (sx > 0 && i === 1) anchors.legs = anchor(legs, c.x, c.y, c.z);
    });
  });

  /* wings */
  function buildWing(shape, opts) {
    const content = new THREE.Group();
    content.rotation.x = Math.PI / 2; // shape y → +z (forward), shape -z → +y (up)
    const painter = wingPainter(shape, opts.dial, opts.eyes);
    const { map, emap, bb } = painter;
    const geo = new THREE.ShapeGeometry(shape, 48);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / w, (pos.getY(i) - bb.min.y) / h);
    const mat = new THREE.MeshPhysicalMaterial({
      map, emissiveMap: emap, emissive: new THREE.Color('#ffb45a'), emissiveIntensity: 0.4,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      roughness: 0.18, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1,
      iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 620],
    });
    const membrane = new THREE.Mesh(geo, mat);
    membrane.renderOrder = 2;
    content.add(membrane);
    painter.paint(wingPalette);
    painters.push({ paint: painter.paint, material: mat });

    const outline = shape.getSpacedPoints(160).map(p => new THREE.Vector3(p.x, p.y, 0));
    outline.pop();
    content.add(tube(outline, 0.026, M.brass, true, 260));
    for (let i = 0; i < outline.length; i += 8) content.add(ball(outline[i].clone().setZ(-0.02), 0.018, M.brassDark, 8));

    // veins fan out from the root at even angles to the margin
    const rootV = new THREE.Vector3(0.06, opts.rootY ?? 0, 0);
    const cand = outline.filter(p => p.distanceTo(rootV) > 0.6).map(p => ({ p, a: Math.atan2(p.y - rootV.y, p.x - rootV.x), d: p.distanceTo(rootV) }));
    const amin = Math.min(...cand.map(c => c.a)), amax = Math.max(...cand.map(c => c.a));
    const veins = [];
    for (let i = 0; i < opts.veins; i++) {
      const target = amin + (amax - amin) * (0.08 + 0.84 * i / (opts.veins - 1));
      let best = null;
      cand.forEach(c => { if (Math.abs(c.a - target) < 0.05 && (!best || c.d > best.d)) best = c; });
      if (!best) best = cand.reduce((b, c) => Math.abs(c.a - target) < Math.abs(b.a - target) ? c : b);
      const end = best.p;
      const mid = rootV.clone().lerp(end, 0.5);
      const dir = end.clone().sub(rootV).normalize();
      mid.add(new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(0.07));
      const curve = new THREE.QuadraticBezierCurve3(rootV, mid, end);
      veins.push(curve);
      content.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 30, i % 2 ? 0.01 : 0.014, 6), i % 2 ? M.brassDark : M.brass));
    }
    [0.42, 0.74].forEach((t, k) => {
      const pts = veins.map(v => v.getPoint(t));
      content.add(tube(pts, k ? 0.008 : 0.012, M.copper, false, 80));
      if (!k) pts.forEach(p => content.add(ball(p, 0.02, M.brass, 8)));
    });

    const wg = makeGear(M, opts.gearTeeth, 0.018, 0.022, M.brass);
    wg.position.set(opts.gear.x, opts.gear.y, -0.03);
    content.add(wg);
    const wg2 = makeGear(M, 9, 0.018, 0.022, M.copper);
    const cd = (opts.gearTeeth + 9) * 0.018 / 2;
    wg2.position.set(opts.gear.x + cd * Math.cos(opts.gear.a), opts.gear.y + cd * Math.sin(opts.gear.a), -0.03);
    content.add(wg2);
    gears.push({ obj: wg, axis: 'z', phase: 0, ratio: 1.3 });
    gears.push({ obj: wg2, axis: 'z', phase: Math.PI / 9, ratio: -1.3 * opts.gearTeeth / 9 });
    return content;
  }

  function hinge(side, pos, shape, opts, kind) {
    const holder = new THREE.Group();
    holder.position.set(side * pos.x, pos.y, pos.z);
    if (side < 0) holder.scale.x = -1;
    const pivot = new THREE.Group();
    pivot.rotation.order = 'ZXY';
    const content = buildWing(shape, opts);
    pivot.add(content);
    holder.add(pivot);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 16), M.steel);
    pin.rotation.x = Math.PI / 2;
    holder.add(pin);
    [-0.13, 0.13].forEach(z => holder.add(ball(new THREE.Vector3(0, 0, z), 0.045, M.brass, 12)));
    bug.add(holder);
    wings.push({ pivot, kind, side });
    explode.push({ obj: holder, base: holder.position.clone(), dir: new THREE.Vector3(side * 0.9, kind === 'fore' ? 0.25 : 0.05, kind === 'fore' ? 0.2 : -0.3) });
    if (side > 0) {
      if (kind === 'fore') { anchors.fore = anchor(content, 2.2, 0.95, -0.02); anchors.hinge = anchor(holder, 0, 0.05, 0.13); anchors.wingGear = anchor(content, opts.gear.x, opts.gear.y, -0.05); }
      else anchors.hind = anchor(content, 0.9, -2.5, -0.02);
    }
  }
  [-1, 1].forEach(side => {
    hinge(side, { x: 0.31, y: 0.04, z: 0.14 }, foreShape(),
      { veins: 8, dial: { x: 1.95, y: 0.42, r: 0.52 }, eyes: [{ x: 2.72, y: 0.9, r: 0.17 }, { x: 2.3, y: -0.15, r: 0.12 }], gear: { x: 0.62, y: 0.14, a: 0.3 }, gearTeeth: 14 }, 'fore');
    hinge(side, { x: 0.29, y: 0.0, z: -0.2 }, hindShape(),
      { veins: 7, rootY: -0.05, dial: { x: 1.18, y: -1.05, r: 0.42 }, eyes: [{ x: 1.72, y: -1.55, r: 0.16 }, { x: 0.93, y: -2.35, r: 0.08 }], gear: { x: 0.5, y: -0.32, a: -0.6 }, gearTeeth: 12 }, 'hind');
  });

  bug.rotation.x = -0.12;
  return { bug, gears, wings, painters, abdomen, core, coreLight, anchors, explode, dome };
}

/* Anatomy labels: which anchor each label sits on */
export const PART_LABELS = [
  ['fore', 'Forewing', '8 radial veins · discal cross-vein'],
  ['hind', 'Hindwing', 'swallowtail, 7 veins'],
  ['train', 'Gear train', '16T : 10T : 12T under a blued hairspring'],
  ['dome', 'Glass dome', ''],
  ['core', 'Mainspring core', 'pulses with each beat'],
  ['eye', 'Compound eye', 'faceted icosahedron'],
  ['antenna', 'Clubbed antenna', '13 beads, ruby tip'],
  ['abdomen', 'Abdomen', '9 nested segments'],
  ['legs', 'Legs', '3 pairs, 2 joints each'],
];
