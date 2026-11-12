export const TOTAL_MEMBERS = 18;

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function wrapAngle(a: number): number {
  const twoPi = Math.PI * 2;
  let r = ((a + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  if (r <= -Math.PI) r += twoPi;
  return r;
}

export function shortest(target: number, from: number, total = TOTAL_MEMBERS): number {
  const half = total / 2;
  return mod(target - from + half, total) - half;
}

export function generateQrPath(): string {
  let d = '';
  const finders = [
    [0, 0],
    [18, 0],
    [0, 18],
  ];
  for (let f = 0; f < finders.length; f++) {
    const ox = finders[f][0];
    const oy = finders[f][1];
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (border || core) {
          d += `M${ox + x} ${oy + y}h1v1h-1z`;
        }
      }
    }
  }
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < 25; x++) {
      if ((x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16)) continue;
      if (rnd() > 0.52) {
        d += `M${x} ${y}h1v1h-1z`;
      }
    }
  }
  return d;
}

export interface RingMetrics {
  W: number;
  H: number;
  mobile: boolean;
  bottomPad: number;
  topPad: number;
  modelH: number;
  w: number;
  dragPx: number;
  cx: number;
  cy: number;
  ry: number;
  rx: number;
  frontH: number;
  front: number;
  loopY: number;
  ringY: number;
}

export function computeRingMetrics(W: number, H: number, innerW: number): RingMetrics {
  const mobile = innerW < 810;
  const bottomPad = mobile ? 168 : 120;
  const topPad = 136;
  const modelH = Math.max(200, Math.round((H - bottomPad - 18 - topPad) / 1.12));
  const w = (modelH * 4) / 7;
  const dragPx = Math.max(mobile ? 70 : 95, W * 0.18);
  const cx = W * 0.5;
  const cy = topPad + (H - topPad - bottomPad) * 0.5 + 6;
  const ry = (H - topPad - bottomPad) * (mobile ? 0.34 : 0.37);
  const rx = Math.min(W * (mobile ? 0.36 : 0.36), ry * (mobile ? 1.25 : 1.9));
  const frontH = H * (mobile ? 0.22 : 0.28);
  const front = frontH / modelH;
  const loopY = cy - frontH * 0.5 - 6;
  const ringY = cy;
  return {
    W,
    H,
    mobile,
    bottomPad,
    topPad,
    modelH,
    w,
    dragPx,
    cx,
    cy,
    ry,
    rx,
    frontH,
    front,
    loopY,
    ringY,
  };
}

export function computeRingBody(i: number, pos: number, m: RingMetrics, total = TOTAL_MEMBERS) {
  const STEP = (Math.PI * 2) / total;
  const a = wrapAngle((i - pos) * STEP);
  const depth = (1 + Math.cos(a)) / 2;
  const dist = Math.abs(a) / STEP;
  const near = clamp(1 - dist, 0, 1);
  const s = m.front * (0.46 + 0.54 * depth) * (1 + 0.18 * near);
  const x = m.cx + m.rx * Math.sin(a);
  const y = m.cy + m.ry * Math.cos(a) + m.modelH * s * 0.08;
  const blur = Math.max(0, (1 - depth) * 2.2 - 0.3);
  const z = Math.round(depth * 1000) + 10;
  return { a, depth, dist, near, s, x, y, blur, z };
}

export function stepSpring(pos: number, goal: number, vel: number, dt: number) {
  const STIFF = 95;
  const DAMP = 2 * Math.sqrt(95);
  const clampedDt = Math.min(0.034, dt);
  const h = clampedDt / 3;
  let p = pos;
  let v = vel;
  for (let k = 0; k < 3; k++) {
    const acc = -STIFF * (p - goal) - DAMP * v;
    v += acc * h;
    p += v * h;
  }
  const settled = Math.abs(p - goal) <= 5e-4 && Math.abs(v) <= 5e-4;
  if (settled) {
    return { pos: goal, vel: 0, settled: true };
  }
  return { pos: p, vel: v, settled: false };
}

export interface SearchableMember {
  name: string;
  role: string;
  dept: string;
  tier?: string;
  team?: string;
  handle?: string;
  badges?: string[];
}

export function matchesMember(member: SearchableMember, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const haystack = [
    member.name,
    member.role,
    member.dept,
    member.tier || '',
    member.handle || '',
  ]
    .join(' ')
    .toLowerCase();
  return tokens.every((tok) => haystack.includes(tok));
}

export function filterMembers<T extends SearchableMember>(members: T[], rawQuery: string): T[] {
  return members.filter((m) => matchesMember(m, rawQuery));
}

