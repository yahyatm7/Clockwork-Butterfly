// Clockwork Butterfly — scene setup, aesthetic modes, anatomy view, telemetry and animation loop.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { THEMES, MODE_ORDER, paintBackground } from './themes.js';
import { createMaterials, buildButterfly, PART_LABELS } from './butterfly.js';
import { Telemetry } from './telemetry.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const hashTokens = location.hash.replace('#', '').split(/[.~_-]/).filter(Boolean);
const $ = id => document.getElementById(id);

/* ---------- renderer / scene ---------- */
const canvas = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
let dpr = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(dpr);
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
// Screen-space backdrop. A fresh texture is made whenever the canvas size changes.
function setBackground(theme) {
  const cv = document.createElement('canvas');
  paintBackground(cv, theme, innerWidth, innerHeight);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (scene.background && scene.background.isTexture) scene.background.dispose();
  scene.background = tex;
}
scene.fog = new THREE.FogExp2('#e6ebf1', 0.018);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
function placeCamera() {
  const narrow = innerWidth / innerHeight < 0.8;
  const short = innerHeight < 760; // leave room for the control bar
  camera.position.set(4.2, 3.6, 6.2).multiplyScalar((narrow ? 2.2 : 1.1) * (short ? 1.15 : 1));
}
placeCamera();

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3;
controls.maxDistance = 16;
controls.target.set(0, -0.05, 0);
controls.autoRotate = !reduceMotion && params.get('still') !== '1';
controls.autoRotateSpeed = 0.6;

const key = new THREE.DirectionalLight('#ffffff', 2); key.position.set(4, 6, 3); scene.add(key);
const rim = new THREE.DirectionalLight('#ffffff', 1); rim.position.set(-5, 2, -6); scene.add(rim);
const hemi = new THREE.HemisphereLight('#ffffff', '#888888', 0.5); scene.add(hemi);

/* ---------- the specimen ---------- */
const M = createMaterials();
const B = buildButterfly(M, THEMES.porcelain.wing);
scene.add(B.bug);

/* drifting dust */
const dust = (() => {
  const n = 700, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 3 + Math.random() * 10, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    arr.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * 0.6, r * Math.sin(p) * Math.sin(t)], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const m = new THREE.PointsMaterial({ color: '#e0b56a', size: 0.035, transparent: true, opacity: 0.5, depthWrite: false });
  const pts = new THREE.Points(g, m); scene.add(pts); return pts;
})();

/* ---------- post-processing ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.4, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- telemetry ---------- */
const tel = new Telemetry($('spark'), {
  amp: $('tAmp'), lag: $('tLag'), A: $('tA'), B: $('tB'), C: $('tC'), fps: $('tFps'), tri: $('tTri'), calls: $('tCalls'),
});
renderer.info.autoReset = false;

/* ---------- aesthetic modes ---------- */
let mode = null;
let wingGlow = 0.3;
const METALS = ['brass', 'brassDark', 'copper', 'steel', 'blued'];

function applyTheme(name) {
  const T = THEMES[name];
  mode = name;
  document.documentElement.dataset.mode = name;

  setBackground(T);
  scene.fog.color.set(T.fog[0]); scene.fog.density = T.fog[1];
  renderer.toneMapping = T.tone === 'aces' ? THREE.ACESFilmicToneMapping : THREE.NeutralToneMapping;
  renderer.toneMappingExposure = T.exposure;
  [bloom.strength, bloom.radius, bloom.threshold] = T.bloom;
  key.color.set(T.key[0]); key.intensity = T.key[1];
  rim.color.set(T.rim[0]); rim.intensity = T.rim[1];
  hemi.color.set(T.hemi[0]); hemi.groundColor.set(T.hemi[1]); hemi.intensity = T.hemi[2];

  METALS.forEach(k => M[k].color.set(T.metals[k]));
  M.eye.color.set(T.eye[0]); M.eye.emissive.set(T.eye[1]); M.eye.emissiveIntensity = T.eye[2];
  M.core.color.set(T.core).multiplyScalar(T.coreGlow);
  B.coreLight.color.set(T.core);

  B.painters.forEach(p => { p.paint(T.wing); p.material.emissive.set(T.wing.glow); });
  wingGlow = T.wing.glowI;

  dust.material.color.set(T.dust[0]);
  dust.material.opacity = T.dust[1];
  dust.material.blending = T.dust[2] ? THREE.AdditiveBlending : THREE.NormalBlending;
  dust.material.needsUpdate = true;

  const cs = getComputedStyle(document.documentElement);
  tel.setColors({
    fore: cs.getPropertyValue('--accent').trim(),
    hind: cs.getPropertyValue('--accent-2').trim(),
    grid: cs.getPropertyValue('--line').trim(),
    text: cs.getPropertyValue('--muted').trim(),
  });

  $('modeName').textContent = T.label;
  document.querySelectorAll('.swatch').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === name)));
  try { history.replaceState(null, '', location.pathname + location.search + '#' + name); } catch (e) { /* sandboxed frames may refuse */ }
}

let switching = false;
function switchMode(name) {
  if (name === mode || switching || !THEMES[name]) return;
  if (reduceMotion) { applyTheme(name); return; }
  switching = true;
  const curtain = $('curtain');
  curtain.classList.add('on');
  setTimeout(() => {
    applyTheme(name);
    requestAnimationFrame(() => { curtain.classList.remove('on'); switching = false; });
  }, 190);
}

// swatches
const row = $('modeRow');
MODE_ORDER.forEach((name, i) => {
  const T = THEMES[name];
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'swatch';
  b.dataset.mode = name;
  b.style.setProperty('--sw-bg', T.swatch[0]);
  b.style.setProperty('--sw-accent', T.swatch[1]);
  b.setAttribute('aria-label', `${T.label} mode (key ${i + 1})`);
  b.title = `${T.label} · ${i + 1}`;
  b.addEventListener('click', () => switchMode(name));
  row.appendChild(b);
});

/* ---------- anatomy labels ---------- */
const labelsEl = $('labels');
const labels = PART_LABELS.filter(([k]) => B.anchors[k]).map(([k, name, note]) => {
  const el = document.createElement('div');
  el.className = 'label';
  el.innerHTML = `<i></i><span>${name}${note ? `<small>${note}</small>` : ''}</span>`;
  labelsEl.appendChild(el);
  return { el, anchor: B.anchors[k] };
});
const tmp = new THREE.Vector3();
function updateLabels(amount) {
  labelsEl.style.display = amount > 0.02 ? '' : 'none';
  if (amount <= 0.02) return;
  const op = Math.max(0, (amount - 0.4) / 0.6);
  labels.forEach(({ el, anchor }) => {
    anchor.getWorldPosition(tmp).project(camera);
    if (tmp.z > 1) { el.style.opacity = 0; return; }
    const x = (tmp.x * 0.5 + 0.5) * innerWidth, y = (-tmp.y * 0.5 + 0.5) * innerHeight;
    const flip = x > innerWidth - 240; // keep labels near the right edge on screen
    el.classList.toggle('flip', flip);
    el.style.transform = flip
      ? `translate(${(x + 3.5).toFixed(1)}px, ${y.toFixed(1)}px) translate(-100%, -50%)`
      : `translate(${(x - 3.5).toFixed(1)}px, ${y.toFixed(1)}px) translateY(-50%)`;
    el.style.opacity = op;
  });
}

/* ---------- controls UI ---------- */
const beatIn = $('beat'), beatOut = $('beatOut');
let beats = reduceMotion ? 0.4 : 1.2;
beatIn.value = beats;
let paused = false, anatomy = false;
function showRate() { beatOut.textContent = `${beats.toFixed(1)} Hz · ${Math.round(beats * 7200).toLocaleString('en-US')} vph`; }
showRate();
beatIn.addEventListener('input', () => { beats = parseFloat(beatIn.value); showRate(); });

const pauseBtn = $('pauseBtn'), orbitBtn = $('orbitBtn'), anatomyBtn = $('anatomyBtn'), telBtn = $('telBtn'), captureBtn = $('captureBtn');
function setPaused(p) { paused = p; pauseBtn.setAttribute('aria-pressed', String(p)); pauseBtn.textContent = p ? 'Resume' : 'Pause'; }
function setAnatomy(a) { anatomy = a; anatomyBtn.setAttribute('aria-pressed', String(a)); }
function setTelemetry(on) { $('telemetry').hidden = !on; telBtn.setAttribute('aria-pressed', String(on)); }
function setOrbit(on) { controls.autoRotate = on; orbitBtn.setAttribute('aria-pressed', String(on)); }
pauseBtn.addEventListener('click', () => setPaused(!paused));
orbitBtn.addEventListener('click', () => setOrbit(!controls.autoRotate));
anatomyBtn.addEventListener('click', () => setAnatomy(!anatomy));
telBtn.addEventListener('click', () => setTelemetry($('telemetry').hidden));
setOrbit(controls.autoRotate);

// PNG capture works when the page is served on its own (e.g. GitHub Pages), not inside an embedding frame.
if (window.self === window.top) {
  captureBtn.hidden = false;
  captureBtn.addEventListener('click', () => {
    composer.render();
    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `clockwork-butterfly-${mode}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  });
}

addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= MODE_ORDER.length) { switchMode(MODE_ORDER[n - 1]); return; }
  if (e.key === 'a' || e.key === 'A') setAnatomy(!anatomy);
  else if (e.key === 't' || e.key === 'T') setTelemetry($('telemetry').hidden);
  else if (e.code === 'Space' && e.target.tagName !== 'BUTTON') { e.preventDefault(); setPaused(!paused); }
});

/* ---------- initial state from URL ---------- */
const startMode = hashTokens.find(t => THEMES[t]) || params.get('mode') || 'porcelain';
applyTheme(THEMES[startMode] ? startMode : 'porcelain');
if (hashTokens.includes('anatomy') || params.get('anatomy') === '1') setAnatomy(true);
if (hashTokens.includes('telemetry') || params.get('telemetry') === '1') setTelemetry(true);
if (params.get('ui') === '0') document.querySelectorAll('.top, .controls').forEach(el => { el.hidden = true; });

/* ---------- animate ---------- */
const clock = new THREE.Clock();
let phase = 0, gearAngle = 0, t = 0, speedEase = 1, explodeAmt = anatomy ? 1 : 0;
if (params.has('phase')) { phase = parseFloat(params.get('phase')) || 0; t = phase; setPaused(true); speedEase = 0; }
let perfTimer = 0, downgraded = false;

function flap(kind, amp) {
  const lag = kind === 'hind' ? 0.35 : 0;
  const f = Math.sin(phase - lag);
  const shaped = f > 0 ? Math.pow(f, 0.8) : -Math.pow(-f, 1.2); // quicker, stronger downstroke
  return { z: 0.18 + 0.78 * amp * shaped, x: 0.16 * amp * Math.cos(phase - lag) * (kind === 'fore' ? 1 : 0.6) };
}

function tick(fixedDt, draw = true) {
  const dt = fixedDt ?? Math.min(clock.getDelta(), 0.05);
  speedEase += ((paused ? 0 : 1) - speedEase) * Math.min(1, dt * 3);
  const run = dt * speedEase;
  t += run;
  phase += run * beats * Math.PI * 2;
  const gearRate = beats * 2.4 * speedEase; // rad/s of gear A
  gearAngle += dt * gearRate;

  explodeAmt += ((anatomy ? 1 : 0) - explodeAmt) * Math.min(1, dt * (reduceMotion ? 20 : 3.5));
  const e = explodeAmt * explodeAmt * (3 - 2 * explodeAmt);
  B.explode.forEach(p => p.obj.position.copy(p.base).addScaledVector(p.dir, e));
  const amp = 1 - 0.75 * e;

  let foreDeg = 0, hindDeg = 0;
  B.wings.forEach(({ pivot, kind }) => {
    const r = flap(kind, amp);
    pivot.rotation.z = r.z; pivot.rotation.x = r.x;
    if (kind === 'fore') foreDeg = THREE.MathUtils.radToDeg(r.z); else hindDeg = THREE.MathUtils.radToDeg(r.z);
  });

  B.bug.position.y = (-0.1 * Math.sin(phase + 0.6) + 0.15 * Math.sin(t * 0.55)) * amp;
  B.bug.rotation.z = 0.05 * Math.sin(t * 0.4);
  B.bug.rotation.y = 0.08 * Math.sin(t * 0.3);
  B.abdomen.forEach((seg, i) => { seg.rotation.x = -0.03 - 0.025 * Math.sin(phase - i * 0.35) * speedEase; });

  B.gears.forEach(g => {
    if (g.osc) { g.obj.rotation.y = 0.6 * Math.sin(phase * 2); return; }
    const a = g.phase + gearAngle * g.ratio;
    if (g.axis === 'y') g.obj.rotation.y = a; else g.obj.rotation.z = a;
  });

  const pulse = 0.5 + 0.5 * Math.sin(phase);
  B.coreLight.intensity = 1.6 + 1.6 * pulse;
  B.core.scale.setScalar(0.92 + 0.12 * pulse);
  B.painters.forEach(p => { p.material.emissiveIntensity = wingGlow * (0.75 + 0.6 * pulse); });

  dust.rotation.y += dt * 0.015;
  controls.autoRotateSpeed = anatomy ? 0.25 : 0.6;
  controls.update();

  if (draw) {
    renderer.info.reset();
    composer.render();
    updateLabels(e);
  }

  // telemetry
  tel.frame(dt);
  tel.push(dt, foreDeg, hindDeg);
  if (draw && !$('telemetry').hidden) {
    tel.draw();
    const rpm = r => Math.abs(gearRate * r) * 60 / (Math.PI * 2);
    tel.text(performance.now(), {
      beats, A: rpm(1), B: rpm(16 / 10), C: rpm(16 / 12),
      tri: renderer.info.render.triangles, calls: renderer.info.render.calls,
    });
  }

  // adaptive quality: drop to 1× pixel ratio once if the frame rate stays low
  perfTimer += dt;
  if (!downgraded && perfTimer > 4 && tel.fps < 38 && dpr > 1) {
    downgraded = true; dpr = 1;
    renderer.setPixelRatio(1); composer.setPixelRatio(1);
  }

  if (!manual) requestAnimationFrame(() => tick());
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
  setBackground(THEMES[mode]);
});

// ?manual=1 drives the clock by hand (deterministic frames for screenshots and the README GIF).
const manual = params.get('manual') === '1';
if (manual) window.__step = (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) tick(dt, i === n - 1); };
if (params.get('debug') === '1') window.__cb = { scene, renderer, M, bloom, composer, B, dust, THREE, tel };
tick();
