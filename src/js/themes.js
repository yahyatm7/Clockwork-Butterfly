// Aesthetic modes. Each mode sets the 3D look (background, light, metals, wing paint)
// and, through the data-mode attribute, the UI tokens in css/style.css.

export const THEMES = {
  porcelain: {
    label: 'Porcelain',
    swatch: ['#f4f6f9', '#c39a52'],
    bg: { top: '#fbfcfd', bottom: '#dfe5ec', style: 'radial' },
    fog: ['#e6ebf1', 0.018],
    tone: 'neutral', exposure: 1.0,
    bloom: [0.18, 0.35, 0.97],
    key: ['#fff4e2', 2.6], rim: ['#9cc8ff', 1.3], hemi: ['#ffffff', '#b9a78a', 1.0],
    metals: { brass: '#c39a52', brassDark: '#8c6b33', copper: '#bd6f43', steel: '#3a414c', blued: '#2a4f93' },
    eye: ['#0e4a44', '#1fc9b3', 0.9], core: '#ffa640', coreGlow: 1.6,
    dust: ['#9c7a3e', 0.28, false],
    wing: {
      stops: ['rgba(18,62,76,0.72)', 'rgba(36,132,142,0.42)', 'rgba(120,190,200,0.26)', 'rgba(205,140,60,0.66)'],
      band: 'rgba(170,105,40,0.6)', bandDark: 'rgba(40,25,10,0.55)', hex: 0.35,
      dial: 'rgba(150,100,40,0.9)', glowLine: '#ffd28a', glow: '#ffb45a', glowI: 0.22,
      eye: ['rgba(255,230,160,0.95)', 'rgba(40,190,180,0.85)', 'rgba(10,30,40,0.9)', 'rgba(205,145,60,0.8)'],
    },
  },
  verdigris: {
    label: 'Verdigris',
    swatch: ['#e1ece6', '#3f8f78'],
    bg: { top: '#f3f8f5', bottom: '#cbdcd3', style: 'radial' },
    fog: ['#dbe7e1', 0.018],
    tone: 'neutral', exposure: 1.0,
    bloom: [0.2, 0.35, 0.97],
    key: ['#fff6df', 2.5], rim: ['#a8f0d8', 1.2], hemi: ['#f4fff9', '#9a9a6a', 1.0],
    metals: { brass: '#a8914e', brassDark: '#5f7a64', copper: '#4f9a86', steel: '#2f3a36', blued: '#2c5a52' },
    eye: ['#3a2a06', '#f0b43c', 1.0], core: '#f2c14e', coreGlow: 1.6,
    dust: ['#6f8f76', 0.28, false],
    wing: {
      stops: ['rgba(15,60,45,0.72)', 'rgba(50,140,110,0.40)', 'rgba(150,200,170,0.28)', 'rgba(200,170,70,0.62)'],
      band: 'rgba(110,90,30,0.55)', bandDark: 'rgba(20,35,25,0.5)', hex: 0.34,
      dial: 'rgba(120,95,30,0.9)', glowLine: '#f6dc8a', glow: '#e8c060', glowI: 0.25,
      eye: ['rgba(255,240,170,0.95)', 'rgba(60,170,130,0.85)', 'rgba(15,35,25,0.9)', 'rgba(200,160,60,0.8)'],
    },
  },
  midnight: {
    label: 'Midnight',
    swatch: ['#0b0e13', '#c9a15a'],
    bg: { top: '#111722', bottom: '#040507', style: 'radial' },
    fog: ['#07090d', 0.045],
    tone: 'aces', exposure: 1.05,
    bloom: [0.45, 0.5, 0.86],
    key: ['#ffe2b0', 2.2], rim: ['#6fd8ff', 1.4], hemi: ['#3a4a5a', '#120c06', 0.35],
    metals: { brass: '#c9a15a', brassDark: '#8a6a32', copper: '#c07445', steel: '#2b3038', blued: '#1f3b6e' },
    eye: ['#0c3a36', '#27f0d2', 1.6], core: '#ffae4a', coreGlow: 2.2,
    dust: ['#e0b56a', 0.55, true],
    wing: {
      stops: ['rgba(12,40,48,0.75)', 'rgba(24,110,118,0.42)', 'rgba(60,150,150,0.30)', 'rgba(210,140,60,0.62)'],
      band: 'rgba(190,120,50,0.55)', bandDark: 'rgba(40,20,8,0.6)', hex: 0.35,
      dial: 'rgba(240,200,120,0.85)', glowLine: '#ffd28a', glow: '#ffb45a', glowI: 0.55,
      eye: ['rgba(255,230,160,0.95)', 'rgba(60,220,200,0.8)', 'rgba(10,30,40,0.9)', 'rgba(210,150,60,0.8)'],
    },
  },
};

export const MODE_ORDER = ['porcelain', 'verdigris', 'midnight'];

// Paints the screen-space backdrop for a mode: a soft radial gradient.
export function paintBackground(canvas, theme, w, h) {
  const W = 1024, H = Math.max(2, Math.round(1024 * h / w));
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  const { top, bottom } = theme.bg;
  const g = c.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.62);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
