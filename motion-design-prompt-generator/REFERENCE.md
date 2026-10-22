# Reference — starter files

Verbatim copies of `templates/remotion-starter`. Read this only when you have to print the starter files, because the user has no starter folder, or when you need a helper's exact source. `spec.ts`, `Film.tsx`, `lib/film.tsx`, `scenes/Scene01.tsx` and `scripts/cues.json` are a placeholder film; everything else never changes.

## `package.json`

```json
{
  "name": "motion-film",
  "private": true,
  "scripts": {
    "score": "node scripts/score.mjs",
    "prestudio": "node scripts/score.mjs",
    "studio": "remotion studio",
    "prerender": "node scripts/score.mjs",
    "render": "remotion render Film out/film.mp4",
    "prepreview": "node scripts/score.mjs",
    "preview": "remotion render Film out/preview.mp4 --scale=0.5",
    "still": "remotion still Film out/still.png",
    "check": "bash scripts/check.sh"
  },
  "dependencies": {
    "@remotion/cli": "4.0.537",
    "@remotion/google-fonts": "4.0.537",
    "@remotion/noise": "4.0.537",
    "@remotion/paths": "4.0.537",
    "@remotion/shapes": "4.0.537",
    "@remotion/transitions": "4.0.537",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "remotion": "4.0.537"
  },
  "devDependencies": {
    "@types/react": "19.1.8",
    "typescript": "5.8.3"
  },
  "allowScripts": {
    "esbuild@0.28.1": true
  }
}
```

## `tsconfig.json`

```json
{"compilerOptions":{"target":"ES2022","module":"ESNext","moduleResolution":"Bundler","jsx":"react-jsx","strict":true,"skipLibCheck":true,"noEmit":true,"lib":["DOM","ES2022"]},"include":["src"]}
```

## `src/index.ts`

```ts
import {registerRoot} from 'remotion';
import {Root} from './Root';
registerRoot(Root);
```

## `src/Root.tsx`

```tsx
import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {FILM} from './spec';

export const Root: React.FC = () => (
  <Composition id="Film" component={Film} durationInFrames={Math.round(FILM.duration * FILM.fps)}
    fps={FILM.fps} width={FILM.width} height={FILM.height} />
);
```

## `src/lib/motion.tsx`

```tsx
// motion.tsx — style-neutral motion helpers for Remotion (React + SVG).
// Everything is a pure function of the current frame: seek anywhere, render any frame alone.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {evolvePath, interpolatePath} from '@remotion/paths';
import {noise2D} from '@remotion/noise';

// ---------- time ----------
export const useTime = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  return {frame, fps, t: frame / fps, D: durationInFrames / fps, width, height};
};

// Exact endpoints: Remotion's Easing.exp is ~0.0005 at 0, which leaks hidden layers. These hit 0 and 1 exactly.
const expoIn = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, 10 * x - 10));
const expoOut = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const expoInOut = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
export const EASE = {
  out: expoOut,                         // arrivals
  in: expoIn,                           // motivated exits, presses
  inOut: expoInOut,                     // wipes, scans
  smooth: Easing.bezier(0.65, 0, 0.35, 1),
  snap: Easing.bezier(0.2, 0, 0, 1),    // decisive UI-like snap
  linear: Easing.linear,                // conveyors, clocks, scans
};

// 0..1 over [start, start + dur] seconds, eased and clamped.
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = EASE.smooth) =>
  interpolate(t, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

// Spring that lands on `landing` seconds, starting `lead` seconds early. damping 200 = no overshoot.
// Pass bounce > 0 only when the design system allows overshoot.
export const settle = (t: number, fps: number, landing: number, o: {lead?: number; dur?: number; bounce?: number} = {}) => {
  const lead = o.lead ?? 0.05, dur = o.dur ?? 0.45;
  return spring({
    frame: Math.round((t - (landing - lead)) * fps),
    fps,
    durationInFrames: Math.round(dur * fps),
    config: o.bounce ? {damping: 12 / o.bounce, stiffness: 180, mass: 1} : {damping: 200},
  });
};

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// Beat grid: beats(120).at(9) = 4.5 s; .bar(3) = 6 s.
export const beats = (bpm: number, perBar = 4) => {
  const b = 60 / bpm;
  return {len: b, at: (n: number) => n * b, bar: (n: number) => n * b * perBar, index: (t: number) => Math.floor(t / b + 1e-6)};
};

// ---------- randomness & noise (deterministic) ----------
export const rand = (seed: string | number) => random(String(seed));
export const wobble = (seed: string, i: number, t: number, speed = 1) => noise2D(seed, i * 0.137, t * speed);
export const stepped = (t: number, perSecond: number) => Math.floor(t * perSecond) / perSecond; // "on twos" / boil

// ---------- geometry: every shape as an n-point closed path, so any two morph ----------
export type Pt = [number, number];
export const toPath = (pts: Pt[], closed = true) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + (closed ? ' Z' : '');
export const polygon = (cx: number, cy: number, r: number, sides: number, rot = -Math.PI / 2, n = 96): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i / n) * sides, k = Math.floor(u), f = u - k;
    const a0 = rot + (k / sides) * Math.PI * 2, a1 = rot + ((k + 1) / sides) * Math.PI * 2;
    out.push([cx + r * mix(Math.cos(a0), Math.cos(a1), f), cy + r * mix(Math.sin(a0), Math.sin(a1), f)]);
  }
  return out;
};
export const circle = (cx: number, cy: number, r: number, n = 96, rot = -Math.PI / 2): Pt[] =>
  Array.from({length: n}, (_, i) => [cx + r * Math.cos(rot + (i / n) * Math.PI * 2), cy + r * Math.sin(rot + (i / n) * Math.PI * 2)]);
export const line = (x1: number, y1: number, x2: number, y2: number, n = 96): Pt[] =>
  Array.from({length: n}, (_, i) => [mix(x1, x2, i / (n - 1)), mix(y1, y2, i / (n - 1))]);
export const morphPts = (a: Pt[], b: Pt[], p: number): Pt[] => a.map(([x, y], i) => [mix(x, b[i][0], p), mix(y, b[i][1], p)]);
export const morphPath = (a: string, b: string, p: number) => interpolatePath(p, a, b);
// Draw-on: spread onto a <path> with a stroke.
export const drawOn = (d: string, p: number) => evolvePath(Math.max(0.0001, Math.min(1, p)), d);

// ---------- transformations: one object through many shapes ----------
// keys: the shapes the SAME object passes through, each with the time it is fully formed and how long the
// change into it takes. Returns the object's points at t. All shapes must have the same point count.
export type Key = {at: number; dur: number; pts: Pt[]; ease?: (x: number) => number};
export const chain = (t: number, keys: Key[]): Pt[] => {
  let cur = keys[0].pts;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (k.pts.length !== cur.length) throw new Error(`chain: key ${i} has ${k.pts.length} points, expected ${cur.length}`);
    const p = prog(t, k.at - k.dur, k.dur, k.ease ?? EASE.smooth);
    if (p <= 0) break;
    cur = morphPts(cur, k.pts, p);
  }
  return cur;
};

// Many-to-one with conservation: each part travels to `target`, shrinking as it goes, and the receiving
// blob grows by the mass that has arrived. Use for gather, absorb, converge, 汇聚, 收回.
// Returns each part's current points (null once absorbed) and the receiver's current radius.
export type Part = {pts: Pt[]; arrive: number; mass: number; travel?: number};
export const converge = (t: number, parts: Part[], target: Pt, o: {baseRadius?: number; radiusPerMass?: number} = {}) => {
  let arrived = 0;
  const shapes = parts.map((q) => {
    const travel = q.travel ?? 0.6, p = prog(t, q.arrive - travel, travel, EASE.in);
    arrived += q.mass * p;
    if (p >= 1) return null;
    const [cx, cy] = q.pts.reduce(([a, b], [x, y]) => [a + x / q.pts.length, b + y / q.pts.length], [0, 0]);
    const k = 1 - 0.92 * p;                        // shrink towards a droplet
    return q.pts.map(([x, y]): Pt => [mix(cx, target[0], p) + (x - cx) * k, mix(cy, target[1], p) + (y - cy) * k]);
  });
  return {shapes, radius: (o.baseRadius ?? 0) + (o.radiusPerMass ?? 30) * Math.sqrt(arrived)};
};

// ---------- materials: one scene graph, many renderings ----------
// Describe every shape ONCE as an Item that carries a palette index (its identity). A material renderer
// draws the same items as paper, glass, print, etc. Changing material never changes an item's colour.
export type Item =
  | {d: string; c: number; w?: number}                                   // path, palette index, stroke width
  | {text: string; x: number; y: number; size: number; font: string; weight?: number | string; c: number; anchor?: 'start' | 'middle' | 'end'; spacing?: string};
export type Material =
  | {kind: 'flat'}                                                      // solid fills
  | {kind: 'paper'; shadow?: number; shadowOpacity?: number; edge?: string} // cut paper: fill + hard offset shadow; edge = filter id
  | {kind: 'line'; width?: number; fill?: number}                        // outlines, optional faint fill
  | {kind: 'glass'; width?: number; fill?: number}                       // outlines + faint fill, overlaps add up (plus-lighter)
  | {kind: 'halftone'; inks: string[]; pitch?: number; offset?: number; angle?: number[]}; // N spot-ink plates of dots

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
// Coverage (0..1) of each spot ink that best reproduces `hex` when the inks multiply on white paper.
export const inkCoverage = (hex: string, inks: string[]) => {
  const t = hexRgb(hex).map((v) => 1 - v);
  return inks.map((ink) => {
    const a = hexRgb(ink).map((v) => 1 - v), aa = a.reduce((s, v) => s + v * v, 0) || 1;
    return Math.max(0, Math.min(1, t.reduce((s, v, i) => s + v * a[i], 0) / aa));
  });
};

const isText = (it: Item): it is Extract<Item, {text: string}> => 'text' in it;
const shape = (it: Item, p: React.SVGProps<SVGElement>, key: React.Key) =>
  isText(it)
    ? <text key={key} x={it.x} y={it.y} fontSize={it.size} fontFamily={it.font} fontWeight={it.weight ?? 700} textAnchor={it.anchor ?? 'start'}
        style={{whiteSpace: 'pre', letterSpacing: it.spacing}} {...(p as React.SVGProps<SVGTextElement>)}>{it.text}</text>
    : <path key={key} d={it.d} {...(p as React.SVGProps<SVGPathElement>)} />;

export const MaterialLayer: React.FC<{items: Item[]; material: Material; palette: string[]; id?: string}> = ({items, material: m, palette, id = 'm'}) => {
  if (m.kind === 'flat') return <g>{items.map((it, i) => shape(it, {fill: palette[it.c]}, i))}</g>;
  if (m.kind === 'paper') {
    const s = m.shadow ?? 6;
    return (
      <g filter={m.edge ? `url(#${m.edge})` : undefined}>
        {items.map((it, i) => (
          <g key={i}>
            {shape(it, {fill: '#000', fillOpacity: m.shadowOpacity ?? 0.2, transform: `translate(${s} ${s})`}, 's')}
            {shape(it, {fill: palette[it.c]}, 'f')}
          </g>
        ))}
      </g>
    );
  }
  if (m.kind === 'line' || m.kind === 'glass') {
    return (
      <g style={{isolation: 'isolate'}}>
        {items.map((it, i) => (
          <g key={i} style={m.kind === 'glass' ? {mixBlendMode: 'plus-lighter'} : undefined}>
            {shape(it, {fill: palette[it.c], fillOpacity: m.fill ?? (m.kind === 'glass' ? 0.12 : 0), stroke: palette[it.c], strokeWidth: (isText(it) ? undefined : it.w) ?? m.width ?? 2}, 'g')}
          </g>
        ))}
      </g>
    );
  }
  // halftone: one plate per ink, dots sized by each item's coverage of that ink, plates offset for misregistration
  const pitch = m.pitch ?? 8, levels = Array.from({length: 20}, (_, i) => (i + 1) * 5);
  const cov = palette.map((hex) => inkCoverage(hex, m.inks));
  return (
    <g style={{isolation: 'isolate'}}>
      <defs>
        {m.inks.map((ink, k) => levels.map((lv) => (
          <pattern key={`${k}-${lv}`} id={`${id}-ht${k}-${lv}`} width={pitch} height={pitch} patternUnits="userSpaceOnUse" patternTransform={`rotate(${m.angle?.[k] ?? 15 + k * 30})`}>
            <circle cx={pitch / 2} cy={pitch / 2} r={Math.min(pitch * 0.71, (pitch / 2) * Math.sqrt(lv / 100) * 1.13)} fill={ink} />
          </pattern>
        )))}
      </defs>
      {m.inks.map((_, k) => (
        <g key={k} transform={`translate(${(m.offset ?? 3) * k} 0)`} style={{mixBlendMode: 'multiply'}}>
          {items.map((it, i) => {
            const lv = Math.round(cov[it.c][k] * 20) * 5;
            return lv < 5 ? null : shape(it, {fill: `url(#${id}-ht${k}-${Math.min(100, lv)})`}, i);
          })}
        </g>
      ))}
    </g>
  );
};

// ---------- characters: define once, pose by joints, props attach to hands ----------
// A Body is the character's design sheet: fixed proportions and colours used in every shot.
// A Pose only sets joint angles (degrees; 0 = pointing straight down, +90 = towards +x, 180 = up).
// Elbow and knee angles are relative to the upper limb. Joint positions come from forward kinematics,
// so a hand is always at the end of its arm and a prop given that hand point is always held.
export type Body = {
  torso: [number, number]; head: [number, number];              // width, height in px
  upperArm: number; foreArm: number; thigh: number; shin: number;
  limb: number; hand: number; foot: number; neck?: number;         // limb thickness, hand radius, foot length
  color: {body: string; head: string; limb: string; line?: string; hand?: string; shoe?: string; shade?: string};
  face?: (o: {x: number; y: number; w: number; h: number; mood: string; look: number}) => React.ReactNode;
  // Optional: replace how a part is drawn. The rig still decides where it is. Use these to give the
  // character its own look (cardboard flaps, a dress, a tail); the defaults are only a neutral start.
  parts?: Partial<{
    head: (o: PartBox) => React.ReactNode; torso: (o: PartBox) => React.ReactNode;
    limb: (o: {a: Pt; b: Pt; w0: number; w1: number; color: string; shade: string; kind: 'upperArm' | 'foreArm' | 'thigh' | 'shin'}) => React.ReactNode;
    hand: (o: {at: Pt; dir: number; r: number; color: string; shade: string}) => React.ReactNode;
    foot: (o: {at: Pt; facing: number; len: number; color: string; shade: string}) => React.ReactNode;
  }>;
};
export type PartBox = {x: number; y: number; w: number; h: number; color: string; shade: string; line: string; facing: number; mood: string; look: number};
// Darken (k < 1) or lighten (k > 1) a hex colour, for one-tone shading.
export const shadeHex = (hex: string, k = 0.78) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('');
export type Pose = {
  x: number; y: number;                                           // feet on the ground at (x, y)
  lean?: number; head?: number; mood?: string; look?: number;      // lean and head tilt in degrees; look −1..1
  armL: [number, number]; armR: [number, number];                  // [shoulder, elbow]
  legL: [number, number]; legR: [number, number];                  // [hip, knee]
  facing?: 1 | -1;
};
// rotP: rotate a point about c by deg (positive = clockwise on screen). limbEnd: 0° down, +90° towards +x, 180° up.
const rotP = ([x, y]: Pt, [cx, cy]: Pt, deg: number): Pt => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
const limbEnd = ([x, y]: Pt, len: number, deg: number): Pt => [x + len * Math.sin((deg * Math.PI) / 180), y + len * Math.cos((deg * Math.PI) / 180)];
// Conventions (all degrees, in the character's own frame, positive = towards where it faces):
//   lean: upper body tips forward about the hip. head: extra tilt about the neck.
//   arm [shoulder, elbow]: shoulder 0 = hanging down, 90 = straight forward, 180 = straight up; elbow bends the forearm further forward.
//   leg [hip, knee]: hip 0 = straight down, positive swings the thigh forward; knee bends the shin backward.
export const rig = (b: Body, p: Pose) => {
  const f = p.facing ?? 1, lean = p.lean ?? 0, legLen = b.thigh + b.shin;
  const ankle = b.limb * 0.4;                                       // the ankle sits this far above the ground; the shoe sole is on y
  const hip: Pt = [p.x, p.y - legLen - ankle];
  const up = (q: Pt) => rotP(q, hip, lean * f);                     // upper body points, leaned
  const neck = up([p.x, hip[1] - b.torso[1]]);
  const arm = (side: number, [sA, eA]: [number, number]) => {
    const shoulder = up([p.x + side * (b.torso[0] / 2 - b.limb / 2), hip[1] - b.torso[1] + b.limb]);
    const elbow = limbEnd(shoulder, b.upperArm, (sA + lean) * f);
    return {shoulder, elbow, hand: limbEnd(elbow, b.foreArm, (sA + eA + lean) * f)};
  };
  const leg = (side: number, [hA, kA]: [number, number]) => {
    const top: Pt = [p.x + side * (b.torso[0] / 4), hip[1]], knee = limbEnd(top, b.thigh, hA * f);
    return {hip: top, knee, foot: limbEnd(knee, b.shin, (hA - kA) * f)};
  };
  const head = rotP(up([p.x, hip[1] - b.torso[1] - (b.neck ?? 4) - b.head[1] / 2]), neck, (p.head ?? 0) * f);
  return {hip, neck, head, armL: arm(-1, p.armL), armR: arm(1, p.armR), legL: leg(-1, p.legL), legR: leg(1, p.legR), lean, f};
};
// Where a prop is held: the hand point of side 'L' or 'R'.
export const grip = (b: Body, p: Pose, side: 'L' | 'R') => rig(b, p)[side === 'L' ? 'armL' : 'armR'].hand;
// Which hand is nearer the viewer for this pose (the right hand when facing +x).
export const nearSide = (p: Pose): 'L' | 'R' => ((p.facing ?? 1) === 1 ? 'R' : 'L');

// Layers, back to front: back, far arm, legs, torso, head, held (props in the near hand), near arm, front.
// Put a prop held in the NEAR hand in `held`, so the hand closes over it; a prop held in the far hand goes in `back`.
export const Character: React.FC<{body: Body; pose: Pose; front?: React.ReactNode; back?: React.ReactNode; held?: React.ReactNode}> = ({body: b, pose: p, front, back, held}) => {
  const r = rig(b, p), line = b.color.line ?? 'none', lw = b.color.line ? 2.5 : 0, P = b.parts ?? {};
  const sh = (c: string) => b.color.shade ?? shadeHex(c);
  // default limb: a tapered capsule with a shaded back edge
  const limb = (a: Pt, c: Pt, w0: number, w1: number, color: string, kind: 'upperArm' | 'foreArm' | 'thigh' | 'shin', k: string) => {
    if (P.limb) return <g key={k}>{P.limb({a, b: c, w0, w1, color, shade: shadeHex(color), kind})}</g>;
    const dx = c[0] - a[0], dy = c[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const d = `M${a[0] + nx * w0 / 2} ${a[1] + ny * w0 / 2} L${c[0] + nx * w1 / 2} ${c[1] + ny * w1 / 2} L${c[0] - nx * w1 / 2} ${c[1] - ny * w1 / 2} L${a[0] - nx * w0 / 2} ${a[1] - ny * w0 / 2} Z`;
    // shaded back edge: a thin band inset from the ends, so joints stay clean
    const t0 = 0.12, t1 = 0.88, e0: Pt = [a[0] + dx * t0, a[1] + dy * t0], e1: Pt = [a[0] + dx * t1, a[1] + dy * t1];
    const edge = `M${e0[0] - nx * w0 * 0.3} ${e0[1] - ny * w0 * 0.3} L${e1[0] - nx * w1 * 0.3} ${e1[1] - ny * w1 * 0.3}`;
    return <g key={k}><circle cx={a[0]} cy={a[1]} r={w0 / 2} fill={color} /><circle cx={c[0]} cy={c[1]} r={w1 / 2} fill={color} />
      <path d={d} fill={color} stroke={line} strokeWidth={lw} /><path d={edge} stroke={shadeHex(color, 0.86)} strokeWidth={Math.min(w0, w1) * 0.3} strokeLinecap="butt" /></g>;
  };
  const hand = (at: Pt, from: Pt, k: string) => {
    const dir = (Math.atan2(at[1] - from[1], at[0] - from[0]) * 180) / Math.PI, col = b.color.hand ?? b.color.head;
    if (P.hand) return <g key={k}>{P.hand({at, dir, r: b.hand, color: col, shade: shadeHex(col)})}</g>;
    return <g key={k} transform={`rotate(${dir} ${at[0]} ${at[1]})`}>
      <ellipse cx={at[0] + b.hand * 0.3} cy={at[1]} rx={b.hand * 1.1} ry={b.hand * 0.9} fill={col} stroke={line} strokeWidth={lw} />
      <ellipse cx={at[0] + b.hand * 0.1} cy={at[1] - b.hand * 0.75} rx={b.hand * 0.42} ry={b.hand * 0.32} fill={col} stroke={line} strokeWidth={lw} />
      <ellipse cx={at[0] + b.hand * 0.55} cy={at[1] + b.hand * 0.25} rx={b.hand * 0.5} ry={b.hand * 0.35} fill={shadeHex(col, 0.9)} />
    </g>;
  };
  const foot = (at: Pt, k: string) => {
    const col = b.color.shoe ?? shadeHex(b.color.limb, 0.6);
    if (P.foot) return <g key={k}>{P.foot({at, facing: r.f, len: b.foot, color: col, shade: shadeHex(col)})}</g>;
    const x0 = r.f === 1 ? at[0] - b.limb * 0.45 : at[0] - b.foot - b.limb * 0.55, w = b.foot + b.limb, h = b.limb * 0.8, y1 = at[1] + b.limb * 0.4;
    return <g key={k}><rect x={x0} y={y1 - h} width={w} height={h} rx={h / 2} fill={col} stroke={line} strokeWidth={lw} />
      <rect x={x0} y={y1 - h * 0.3} width={w} height={h * 0.3} rx={h * 0.15} fill={shadeHex(col, 0.7)} /></g>;
  };
  const arm = (a: ReturnType<typeof rig>['armL'], k: string) => (
    <g key={k}>{limb(a.shoulder, a.elbow, b.limb, b.limb * 0.88, b.color.limb, 'upperArm', 'u')}{limb(a.elbow, a.hand, b.limb * 0.88, b.limb * 0.74, b.color.limb, 'foreArm', 'f')}{hand(a.hand, a.elbow, 'h')}</g>
  );
  const leg = (l: ReturnType<typeof rig>['legL'], k: string) => (
    <g key={k}>{limb(l.hip, l.knee, b.limb * 1.1, b.limb * 0.95, b.color.limb, 'thigh', 't')}{limb(l.knee, l.foot, b.limb * 0.95, b.limb * 0.8, b.color.limb, 'shin', 's')}{foot(l.foot, 'ft')}</g>
  );
  const far = r.f === 1 ? r.armL : r.armR, near = r.f === 1 ? r.armR : r.armL;
  const farLeg = r.f === 1 ? r.legL : r.legR, nearLeg = r.f === 1 ? r.legR : r.legL;
  const [tw, th] = b.torso, [hw, hh] = b.head, mood = p.mood ?? 'calm', look = p.look ?? 0;
  const torsoBox: PartBox = {x: p.x, y: r.hip[1] - th / 2, w: tw, h: th, color: b.color.body, shade: sh(b.color.body), line, facing: r.f, mood, look};
  const headBox: PartBox = {x: r.head[0], y: r.head[1], w: hw, h: hh, color: b.color.head, shade: sh(b.color.head), line, facing: r.f, mood, look};
  const shadeSide = (bx: PartBox, round: number) => {
    const sx = bx.facing === 1 ? bx.x - bx.w / 2 : bx.x + bx.w / 2 - bx.w * 0.24;
    return <rect x={sx} y={bx.y - bx.h / 2} width={bx.w * 0.24} height={bx.h} rx={round} fill={bx.shade} />;
  };
  const torso = P.torso ? P.torso(torsoBox) : (
    <g><rect x={p.x - tw / 2} y={r.hip[1] - th} width={tw} height={th} rx={Math.min(tw, th) * 0.12} fill={b.color.body} stroke={line} strokeWidth={lw} />
      <g clipPath="none">{shadeSide(torsoBox, Math.min(tw, th) * 0.12)}</g></g>
  );
  const head = P.head ? P.head(headBox) : (
    <g><rect x={r.head[0] - hw / 2} y={r.head[1] - hh / 2} width={hw} height={hh} rx={Math.min(hw, hh) * 0.16} fill={b.color.head} stroke={line} strokeWidth={lw} />
      {shadeSide(headBox, Math.min(hw, hh) * 0.16)}</g>
  );
  return (
    <g>
      {back}
      {arm(far, 'farArm')}
      {leg(farLeg, 'farLeg')}{leg(nearLeg, 'nearLeg')}
      <g transform={`rotate(${r.lean * r.f} ${r.hip[0]} ${r.hip[1]})`}>{torso}</g>
      <g transform={`rotate(${(r.lean + (p.head ?? 0)) * r.f} ${r.head[0]} ${r.head[1]})`}>
        {head}
        {b.face?.({x: r.head[0], y: r.head[1], w: hw, h: hh, mood, look})}
      </g>
      {held}
      {arm(near, 'nearArm')}
      {front}
    </g>
  );
};
// Blend two poses (e.g. stand → wave) by p in 0..1.
export const poseMix = (a: Pose, b: Pose, p: number): Pose => {
  const m = (u: [number, number], v: [number, number]): [number, number] => [mix(u[0], v[0], p), mix(u[1], v[1], p)];
  return {...a, x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), lean: mix(a.lean ?? 0, b.lean ?? 0, p), head: mix(a.head ?? 0, b.head ?? 0, p),
    look: mix(a.look ?? 0, b.look ?? 0, p), armL: m(a.armL, b.armL), armR: m(a.armR, b.armR), legL: m(a.legL, b.legL), legR: m(a.legR, b.legR), mood: p < 0.5 ? a.mood : b.mood};
};
// Walk cycle: legs and arms swing in opposition; stepsPerSecond full steps.
export const walk = (t: number, base: Pose, stepsPerSecond = 2, swing = 22): Pose => {
  const ph = Math.sin(t * Math.PI * stepsPerSecond), k = Math.max(0, -Math.cos(t * Math.PI * stepsPerSecond * 2)) * 18;
  return {...base, legL: [swing * ph, k * (ph > 0 ? 1 : 0)], legR: [-swing * ph, k * (ph < 0 ? 1 : 0)], armL: [-swing * 0.7 * ph, 10], armR: [swing * 0.7 * ph, 10]};
};

// ---------- components ----------
export const Stage: React.FC<{bg: string; children?: React.ReactNode}> = ({bg, children}) => (
  <AbsoluteFill style={{backgroundColor: bg}}>{children}</AbsoluteFill>
);

// Full-frame SVG in 1920×1080 (or the composition size) user units.
export const Canvas: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => {
  const {width, height} = useVideoConfig();
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>
      {children}
    </svg>
  );
};

// Hand-drawn boil: displaces whatever uses filter={`url(#${id})`}. step = boil changes per second.
export const RoughFilter: React.FC<{id: string; scale?: number; freq?: number; step?: number}> = ({id, scale = 3, freq = 0.035, step = 8}) => {
  const {t} = useTime();
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={Math.floor(t * step)} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
};

// Edge roughness that scales with the element: a 500 px shape gets ~10 px of displacement, a 40 px leaf ~2.
export const roughFor = (sizePx: number, strength = 1) => Math.max(1, sizePx * 0.02 * strength);

// Material filter for marks (ink, paint, print, chalk). Roughens edges (`edge` px, use roughFor) and breaks
// the fill with internal grain (`grain` 0..1). boil > 0 re-seeds the edge noise that many times per second.
export const InkFilter: React.FC<{id: string; edge?: number; freq?: number; grain?: number; grainFreq?: number; boil?: number; seed?: number}> = ({
  id, edge = 6, freq = 0.035, grain = 0.35, grainFreq = 0.7, boil = 0, seed = 3,
}) => {
  const {t} = useTime();
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={boil ? seed + Math.floor(t * boil) : seed} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={edge} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency={grainFreq} numOctaves={2} seed={seed + 50} result="g" />
      <feColorMatrix in="g" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-grain} 0 0 0 ${1 + grain * 0.3}`} result="gm" />
      <feComposite in="d" in2="gm" operator="in" />
    </filter>
  );
};

// Paper with two textures: fine grain plus long fibres along x (rice paper, newsprint, card).
export const Paper: React.FC<{color: string; grain?: number; fibre?: number; seed?: number}> = ({color, grain = 0.1, fibre = 0.08, seed = 2}) => (
  <AbsoluteFill style={{backgroundColor: color}}>
    <Canvas style={{mixBlendMode: 'multiply'}}>
      <filter id={`paper-grain-${seed}`}><feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={3} seed={seed} /><feColorMatrix type="saturate" values="0" /></filter>
      <filter id={`paper-fibre-${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.018 0.16" numOctaves={2} seed={seed + 7} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter={`url(#paper-grain-${seed})`} opacity={grain} />
      <rect width="100%" height="100%" filter={`url(#paper-fibre-${seed})`} opacity={fibre} />
    </Canvas>
  </AbsoluteFill>
);

// Static paper / film grain over the whole frame.
export const Grain: React.FC<{opacity?: number; freq?: number; blend?: React.CSSProperties['mixBlendMode']; seed?: number}> = ({opacity = 0.12, freq = 0.9, blend = 'multiply', seed = 3}) => (
  <Canvas style={{mixBlendMode: blend, opacity, pointerEvents: 'none'}}>
    <filter id={`grain-${seed}`}>
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={seed} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
  </Canvas>
);

// Grid with major lines every `major` cells.
export const Grid: React.FC<{pitch?: number; major?: number; color: string; minor?: number; majorOpacity?: number}> = ({pitch = 60, major = 5, color, minor = 0.13, majorOpacity = 0.26}) => {
  const {width, height} = useVideoConfig();
  const xs = Array.from({length: Math.floor(width / pitch) + 1}, (_, i) => i);
  const ys = Array.from({length: Math.floor(height / pitch) + 1}, (_, i) => i);
  return (
    <Canvas>
      {xs.map((i) => <line key={`x${i}`} x1={i * pitch + 0.5} x2={i * pitch + 0.5} y1={0} y2={height} stroke={color} strokeOpacity={i % major ? minor : majorOpacity} />)}
      {ys.map((i) => <line key={`y${i}`} y1={i * pitch + 0.5} y2={i * pitch + 0.5} x1={0} x2={width} stroke={color} strokeOpacity={i % major ? minor : majorOpacity} />)}
    </Canvas>
  );
};

// Hard-edged reveal of children: from a side, or a circle growing from a point. p 0..1.
export const Reveal: React.FC<{p: number; from?: 'left' | 'right' | 'top' | 'bottom' | 'circle'; at?: Pt; children?: React.ReactNode}> = ({p, from = 'left', at = [960, 540], children}) => {
  if (p <= 0) return null;                       // nothing leaks at 0
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const q = (1 - p) * 100;
  const clip = from === 'circle' ? `circle(${p * 2300}px at ${at[0]}px ${at[1]}px)`
    : from === 'left' ? `inset(0 ${q}% 0 0)` : from === 'right' ? `inset(0 0 0 ${q}%)`
    : from === 'top' ? `inset(0 0 ${q}% 0)` : `inset(${q}% 0 0 0)`;
  return <AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>;
};

// Per-letter type. style(p, i) gets each letter's own progress (start + i * stagger, over dur).
export const Letters: React.FC<{
  text: string; t: number; start: number; stagger?: number; dur?: number; ease?: (x: number) => number;
  style: (p: number, i: number) => React.CSSProperties; box?: React.CSSProperties;
}> = ({text, t, start, stagger = 0.04, dur = 0.4, ease = EASE.out, style, box}) => (
  <div style={{display: 'flex', whiteSpace: 'pre', ...box}}>
    {[...text].map((ch, i) => (
      <span key={i} style={{display: 'inline-block', ...style(prog(t, start + i * stagger, dur, ease), i)}}>{ch}</span>
    ))}
  </div>
);

// Number that rolls between values; format with fixed decimals.
export const Counter: React.FC<{from: number; to: number; p: number; decimals?: number; style?: React.CSSProperties; suffix?: string}> = ({from, to, p, decimals = 0, style, suffix = ''}) => (
  <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>{mix(from, to, p).toFixed(decimals)}{suffix}</span>
);
```

## `src/lib/film.tsx`

```tsx
// film.tsx — this film's own shape builders (one per object ledger row, tagged O##) and helpers.
// Build every shape once at module level with the same point count as anything it morphs into.
export {};
```

## `src/spec.ts`

```tsx
// spec.ts — the film's contract. Every number, colour, font and copy line the prompt states lives here, once,
// tagged with its ledger id (S01, S02, ...). Scenes read from here; they never hard-code a value the prompt gave.
import {loadFont} from '@remotion/google-fonts/Inter';
const {fontFamily} = loadFont('normal', {weights: ['400', '600', '800'], subsets: ['latin']});

export const FILM = {duration: 10, fps: 60, width: 1920, height: 1080, bpm: 120, sound: true}; // S01 (sound: public/score.wav from scripts/cues.json)
export const SAFE = {x: 150, y: 90};                                               // S02
export const FONT = fontFamily;                                                    // S03
export const COLOR = {bg: '#F4F1EA', ink: '#111111', accent: '#E4572E'};           // S04
export const COPY = {title: 'TITLE', sub: 'SUBTITLE'};                             // S05
```

## `src/Film.tsx`

```tsx
// Film.tsx — the master timeline. Layers read ABSOLUTE time t from useTime(); no <Sequence> remounts,
// so objects that persist across scenes never jump. Each scene decides its own visibility from t.
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {useTime} from './lib/motion';
import {COLOR, FILM} from './spec';
import {Scene01} from './scenes/Scene01';

export const Film: React.FC = () => {
  const {t} = useTime();
  return (
    <AbsoluteFill style={{backgroundColor: COLOR.bg}}>
      <Scene01 t={t} />
      {FILM.sound && <Audio src={staticFile('score.wav')} />}
    </AbsoluteFill>
  );
};
```

## `src/scenes/Scene01.tsx`

```tsx
// Scene01.tsx — one scene = one file. Every timestamp is absolute seconds from the storyboard.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Canvas, EASE, Letters, drawOn, prog, toPath, line} from '../lib/motion';
import {COLOR, COPY, FILM, FONT} from '../spec';

export const Scene01: React.FC<{t: number}> = ({t}) => {
  if (t >= FILM.duration) return null;
  const rule = toPath(line(560, 640, 1360, 640), false);
  return (
    <>
      <Canvas>
        <path d={rule} stroke={COLOR.accent} strokeWidth={6} fill="none" {...drawOn(rule, prog(t, 0.5, 0.6, EASE.out))} />
      </Canvas>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily: FONT}}>
        <Letters text={COPY.title} t={t} start={0.1} stagger={0.05} dur={0.45}
          box={{fontSize: 200, fontWeight: 800, color: COLOR.ink, letterSpacing: '-0.02em'}}
          style={(p) => ({transform: `translateY(${(1 - p) * 120}px)`, clipPath: 'inset(-20% 0 0 0)', opacity: p > 0 ? 1 : 0})} />
      </AbsoluteFill>
    </>
  );
};
```

## `scripts/cues.json`

```json
{
  "duration": 10,
  "bpm": 120,
  "loop": false,
  "palette": "data",
  "bed": [
    {"type": "pad", "note": "A2", "start": 0, "end": 10, "gain": 0.12, "fade": 2}
  ],
  "patterns": [
    {"type": "tick", "every": 1, "start": 0, "end": 10, "gain": 0.08}
  ],
  "events": [
    {"t": 0.1, "type": "bell", "note": "E5", "gain": 0.25},
    {"t": 0.5, "type": "whoosh", "dur": 0.6, "gain": 0.3}
  ]
}
```

## `scripts/score.mjs`

```js
// score.mjs — synthesises the film's soundtrack from scripts/cues.json into public/score.wav.
// No samples, no dependencies: every sound is generated, so the same cues always give the same file.
// Usage: node scripts/score.mjs            (reads scripts/cues.json)
//        node scripts/score.mjs other.json
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';

const cues = JSON.parse(readFileSync(process.argv[2] ?? new URL('./cues.json', import.meta.url), 'utf8'));
const SR = 48000, LEN = cues.duration, PAD = 6, N = Math.ceil((LEN + PAD) * SR);
const L = new Float32Array(N), R = new Float32Array(N), SEND = new Float32Array(N);

// ---------- palettes: default timbre, reverb and levels per style ----------
const PALETTES = {
  ink:      {reverb: 0.45, room: 0.86, bright: 0.35, gain: 1.0},  // guqin plucks, drones, water, wood
  swiss:    {reverb: 0.12, room: 0.5,  bright: 0.8,  gain: 1.0},  // clicks, kicks, tight
  data:     {reverb: 0.25, room: 0.7,  bright: 0.6,  gain: 0.9},  // soft ticks, bells, pads
  poster:   {reverb: 0.15, room: 0.55, bright: 0.9,  gain: 1.0},  // kicks, claps, hats
  riso:     {reverb: 0.2,  room: 0.6,  bright: 0.5,  gain: 0.95}, // lo-fi plucks, knocks
  drafting: {reverb: 0.2,  room: 0.65, bright: 0.6,  gain: 0.9},  // pencil scratch, ticks, clicks
};
const P = {...PALETTES[cues.palette ?? 'data'], ...(cues.mix ?? {})};

// ---------- pitch ----------
const SEMI = {C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2};
const hz = (note) => {
  if (typeof note === 'number') return note;
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  if (!m) throw new Error(`bad note ${note}`);
  return 440 * 2 ** ((SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12) / 12);
};

// ---------- deterministic noise ----------
let s = cues.seed ?? 7;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;

// ---------- instruments: each returns a mono Float32Array ----------
const env = (i, a, d, n) => (i < a ? i / a : Math.exp(-(i - a) / d)) * (i < n ? 1 : 0);
const INST = {
  // Karplus-Strong string: guqin, guitar, harp-like. decay 0.99–0.999
  pluck({note = 'A3', dur = 3, decay = 0.996, bright = P.bright}) {
    const f = hz(note), n = Math.round(dur * SR), p = Math.max(2, Math.round(SR / f)), out = new Float32Array(n), buf = new Float32Array(p);
    for (let i = 0; i < p; i++) buf[i] = rnd();
    let last = 0;
    for (let i = 0; i < n; i++) {
      const j = i % p, v = buf[j];
      const nv = decay * (bright * v + (1 - bright) * (v + last) / 2);
      last = v; buf[j] = nv; out[i] = v * Math.min(1, i / 40);
    }
    return out;
  },
  // FM bell / chime
  bell({note = 'E5', dur = 2.5, ratio = 3.5, index = 2}) {
    const f = hz(note), n = Math.round(dur * SR), out = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / SR, e = Math.exp(-t * 2.2); out[i] = Math.sin(2 * Math.PI * f * t + index * e * Math.sin(2 * Math.PI * f * ratio * t)) * e * Math.min(1, i / 30); }
    return out;
  },
  // Sustained pad or drone: a few detuned sines with slow swell; fades in and out over `fade` s.
  pad({note = 'D3', dur = 8, fade = 1.5, voices = 3, fifth = true}) {
    const f = hz(note), n = Math.round(dur * SR), out = new Float32Array(n), fs = [];
    for (let v = 0; v < voices; v++) fs.push(f * (1 + (v - (voices - 1) / 2) * 0.004));
    if (fifth) fs.push(f * 1.5);
    for (let i = 0; i < n; i++) {
      const t = i / SR, e = Math.min(1, t / fade, (dur - t) / fade);
      let v = 0; for (const q of fs) v += Math.sin(2 * Math.PI * q * t) + 0.2 * Math.sin(4 * Math.PI * q * t);
      out[i] = (v / fs.length) * e * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.2 * t));
    }
    return out;
  },
  // Short high click: UI ticks, clock, counters
  tick({freq = 3200, dur = 0.03}) {
    const n = Math.round(dur * SR), out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = (Math.sin(2 * Math.PI * freq * i / SR) * 0.6 + rnd() * 0.4) * Math.exp(-i / (n / 5));
    return out;
  },
  // Kick: sine with falling pitch
  kick({freq = 52, dur = 0.5}) {
    const n = Math.round(dur * SR), out = new Float32Array(n); let ph = 0;
    for (let i = 0; i < n; i++) { const t = i / SR, f = freq + 110 * Math.exp(-t * 28); ph += 2 * Math.PI * f / SR; out[i] = Math.sin(ph) * Math.exp(-t * 7); }
    return out;
  },
  // Clap / snare: band-limited noise burst
  clap({dur = 0.25, tone = 0.5}) {
    const n = Math.round(dur * SR), out = new Float32Array(n); let a = 0, b = 0;
    for (let i = 0; i < n; i++) { const x = rnd(); a += 0.35 * (x - a); b = x - a; out[i] = (tone * b + (1 - tone) * x) * Math.exp(-i / SR * 18); }
    return out;
  },
  hat({dur = 0.06}) {
    const n = Math.round(dur * SR), out = new Float32Array(n); let prev = 0;
    for (let i = 0; i < n; i++) { const x = rnd(); out[i] = (x - prev) * Math.exp(-i / SR * 60); prev = x; }
    return out;
  },
  // Whoosh for wipes and scans: noise swell rising in brightness over `dur`
  whoosh({dur = 0.6, peak = 0.7}) {
    const n = Math.round(dur * SR), out = new Float32Array(n); let lp = 0;
    for (let i = 0; i < n; i++) { const u = i / n, e = u < peak ? u / peak : (1 - u) / (1 - peak); const k = 0.02 + 0.3 * u; lp += k * (rnd() - lp); out[i] = lp * e * 2.2; }
    return out;
  },
  // Water drop: short sine blip sweeping up
  drop({freq = 900, dur = 0.18}) {
    const n = Math.round(dur * SR), out = new Float32Array(n); let ph = 0;
    for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * freq * (1 + 2.5 * t / dur) / SR; out[i] = Math.sin(ph) * Math.exp(-t * 30) * Math.min(1, i / 20); }
    return out;
  },
  // Wood knock / stamp / seal
  knock({freq = 620, dur = 0.22}) {
    const n = Math.round(dur * SR), out = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / SR; out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 2.7 * t) + 0.3 * rnd() * Math.exp(-t * 200)) * Math.exp(-t * 32); }
    return out;
  },
  // Pencil or brush on paper: jittery band-passed noise over `dur`
  scratch({dur = 0.5, rough = 0.6}) {
    const n = Math.round(dur * SR), out = new Float32Array(n); let a = 0, b = 0;
    for (let i = 0; i < n; i++) { const x = rnd(); a += 0.5 * (x - a); b += 0.05 * (a - b); const g = 0.6 + rough * 0.4 * Math.sin(i / SR * 2 * Math.PI * 23); out[i] = (a - b) * g * Math.min(1, i / 400, (n - i) / 400); }
    return out;
  },
  // Ambience beds: rain, wind, room tone. Continuous filtered noise with slow movement; fades in and out over `fade`.
  ambience({dur = 10, kind = 'rain', fade = 1.5, density = 0.5}) {
    const n = Math.round(dur * SR), out = new Float32Array(n); let lp = 0, bp = 0;
    const k = kind === 'wind' ? 0.01 : kind === 'room' ? 0.004 : 0.25;          // rain is bright, wind and room are dark
    for (let i = 0; i < n; i++) {
      const t = i / SR, e = Math.min(1, t / fade, (dur - t) / fade);
      const swell = kind === 'wind' ? 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.11 * t) * Math.sin(2 * Math.PI * 0.037 * t + 1) : 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.23 * t);
      lp += k * (rnd() - lp); bp += 0.02 * (lp - bp);
      let v = (lp - bp) * 2.5 * swell;
      if (kind === 'rain' && Math.abs(rnd()) > 1 - 0.0006 * density) v += rnd() * 0.9; // individual drops
      out[i] = v * e * (kind === 'room' ? 3 : 1);
    }
    return out;
  },
  // Low impact for big arrivals
  boom({freq = 38, dur = 1.6}) {
    const n = Math.round(dur * SR), out = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / SR; out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t)) * Math.exp(-t * 2.5) * Math.min(1, i / 200); }
    return out;
  },
};

// ---------- placing sounds ----------
const place = (t0, buf, gain = 0.5, pan = 0, rev = P.reverb) => {
  const s0 = Math.round(t0 * SR), l = gain * Math.cos((pan + 1) * Math.PI / 4), r = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < buf.length && s0 + i < N; i++) { if (s0 + i < 0) continue; L[s0 + i] += buf[i] * l; R[s0 + i] += buf[i] * r; SEND[s0 + i] += buf[i] * gain * rev; }
};
const play = (c, t) => {
  const f = INST[c.type]; if (!f) throw new Error(`unknown instrument ${c.type}`);
  place(t, f(c), c.gain ?? 0.5, c.pan ?? 0, c.reverb ?? P.reverb);
};

// ---------- guard rails: music is pitched; noise is a short accent, never a bed ----------
const NOISE = new Set(['whoosh', 'scratch', 'clap', 'hat']), PITCHED = new Set(['pluck', 'bell', 'pad']);
const all = [...(cues.events ?? []), ...(cues.bed ?? []), ...(cues.patterns ?? [])];
if (!all.some((c) => PITCHED.has(c.type)) && !(cues.bed ?? []).some((b) => b.type === 'ambience')) {
  console.error('score.mjs: no pitched instrument (pluck, bell, pad) and no ambience bed. Add music, or an ambience bed for a scene that is carried by its environment (rain, wind, room).');
  process.exit(1);
}
const clampNoise = (c, where) => {
  if (NOISE.has(c.type) && (c.dur ?? 0) > 1) { console.warn(`score.mjs: ${where} ${c.type} dur ${c.dur}s > 1s, clamped to 1s`); return {...c, dur: 1}; }
  return c;
};
for (const b of cues.bed ?? []) if (NOISE.has(b.type)) { console.error(`score.mjs: ${b.type} cannot be a bed. Use pad for sustained music or ambience (rain, wind, room) for an environment.`); process.exit(1); }
cues.events = (cues.events ?? []).map((c, i) => clampNoise(c, `events[${i}]`));
cues.patterns = (cues.patterns ?? []).map((c, i) => clampNoise(c, `patterns[${i}]`));

for (const c of cues.events ?? []) play(c, c.t);                       // one-off hits on the timeline
for (const b of cues.bed ?? []) {                                       // pads, drones, ambience
  const start = b.start ?? 0, end = b.end ?? LEN, full = cues.loop !== false && start <= 0 && end >= LEN;
  play({...b, dur: end - start, ...(full ? {fade: 0.001} : {})}, start);     // a full-length bed in a loop never fades: the fold joins it
}
for (const p of cues.patterns ?? []) {                                  // repeating figures on the beat grid
  const step = (60 / (cues.bpm ?? 120)) * (p.every ?? 1), notes = p.notes ?? [null];
  for (let k = 0, t = p.start ?? 0; t < (p.end ?? LEN) - 1e-6; k++, t += step) {
    const note = notes[k % notes.length]; if (note === '-') continue;
    play({...p, ...(note ? {note} : {})}, t);
  }
}

// ---------- reverb: Schroeder (4 combs + 2 allpasses) ----------
const rev = new Float32Array(N);
for (const [d, g] of [[1557, P.room], [1617, P.room - 0.01], [1491, P.room - 0.02], [1422, P.room - 0.03]]) {
  const b = new Float32Array(d); let lp = 0;
  for (let i = 0; i < N; i++) { const y = b[i % d]; lp = 0.7 * y + 0.3 * lp; b[i % d] = SEND[i] + lp * g; rev[i] += y * 0.25; }
}
for (const [d, g] of [[225, 0.5], [556, 0.5]]) {
  const b = new Float32Array(d);
  for (let i = 0; i < N; i++) { const y = b[i % d], x = rev[i]; b[i % d] = x + y * g; rev[i] = y - g * x; }
}
for (let i = 0; i < N; i++) { L[i] += rev[i] * 0.6; R[i] += rev[i] * 0.6; }

// ---------- loop: fold tails past the end back onto the start ----------
const M = Math.round(LEN * SR), outL = new Float32Array(M), outR = new Float32Array(M);
for (let i = 0; i < N; i++) {
  const j = cues.loop === false ? i : i % M; if (j >= M) continue;
  outL[j] += L[i]; outR[j] += R[i];
}
if (cues.loop === false) { const f = Math.round(0.05 * SR); for (let i = 0; i < f; i++) { const g = i / f; outL[M - 1 - i] *= g; outR[M - 1 - i] *= g; } }

// ---------- normalise to -1 dBFS and write 16-bit stereo WAV ----------
let peak = 1e-9; for (let i = 0; i < M; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
const k = (0.891 * P.gain * (cues.master ?? 1)) / peak;
const data = Buffer.alloc(M * 4);
for (let i = 0; i < M; i++) {
  data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(outL[i] * k * 32767))), i * 4);
  data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(outR[i] * k * 32767))), i * 4 + 2);
}
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
mkdirSync(new URL('../public/', import.meta.url), {recursive: true});
writeFileSync(new URL('../public/score.wav', import.meta.url), Buffer.concat([h, data]));
console.log(`public/score.wav  ${LEN}s  palette=${cues.palette ?? 'data'}  events=${(cues.events ?? []).length}  loop=${cues.loop !== false}`);
```

## `scripts/check.sh`

```bash
#!/bin/bash
# check.sh — self-review after a render. Usage: bash scripts/check.sh [out/film.mp4]
# Writes out/check/: sheet.png (12 frames), f-<sec>.png at given times, and prints
# the motion curve (mean frame difference per 0.5 s) with unplanned spikes flagged.
#   TIMES="0 4.8 10 19.9" bash scripts/check.sh     # extra stills at these seconds
set -e
cd "$(dirname "$0")/.."
in="${1:-out/film.mp4}"; out=out/check; mkdir -p "$out"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")

# 1. format against src/spec.ts FILM
spec() { grep -oE "FILM *= *\{[^}]*" src/spec.ts | grep -oE "$1: *[0-9.a-z]+" | head -1 | sed -E 's/.*: *//'; }
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$in")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$in")
R=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$in" | awk -F/ '{print int($1/($2?$2:1)+0.5)}')
A=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$in" | head -1)
echo "format: ${W}x${H} ${R}fps ${D}s audio=${A:-none}"
fail=0
[ -n "$(spec width)" ] && [ "$(spec width)" != "$W" ] && { echo "  FAIL width $W, spec says $(spec width)"; fail=1; }
[ -n "$(spec height)" ] && [ "$(spec height)" != "$H" ] && { echo "  FAIL height $H, spec says $(spec height)"; fail=1; }
[ -n "$(spec fps)" ] && [ "$(spec fps)" != "$R" ] && { echo "  FAIL fps $R, spec says $(spec fps)"; fail=1; }
[ -n "$(spec duration)" ] && awk "BEGIN{exit !($D < $(spec duration) - 0.1 || $D > $(spec duration) + 0.1)}" && { echo "  FAIL duration $D, spec says $(spec duration)"; fail=1; }
[ "$(spec sound)" = "true" ] && [ -z "$A" ] && { echo "  FAIL spec has sound: true but the video has no audio"; fail=1; }
grep -q "title: 'TITLE'" src/spec.ts 2>/dev/null && { echo "  FAIL src/spec.ts is still the starter placeholder (TITLE, 10 s): write FILM and COPY from the prompt"; fail=1; }
[ $fail = 0 ] && echo "  format matches spec.ts"

# 2. first frame and loop seam
px() { ffmpeg -loglevel error -ss "$1" -i "$in" -frames:v 1 -vf "crop=60:60:30:30,scale=1:1" -f rawvideo -pix_fmt rgb24 - | xxd -p; }
c0=$(px 0); c1=$(px 1)
dd=$(awk -v a="$c0" -v b="$c1" 'function h(s,i){return ("0x" substr(s,i,2))+0} BEGIN{m=0; for(i=1;i<=5;i+=2){d=h(a,i)-h(b,i); if(d<0)d=-d; if(d>m)m=d}; print m}')
if [ "$dd" -gt 6 ]; then echo "  FAIL frame 0 background #$c0 differs from 1 s #$c1 (a colour flash at the start)"; fail=1; else echo "  frame 0 background matches (#$c0)"; fi
if ! grep -qE '"loop": *false' scripts/cues.json 2>/dev/null; then
  ffmpeg -loglevel error -y -i "$in" -frames:v 1 -vf "scale=480:270,format=gray" "$out/.first.png"
  ffmpeg -loglevel error -y -sseof -1 -i "$in" -an -update 1 -vf "scale=480:270,format=gray" "$out/.last.png"
  ss=$(ffmpeg -hide_banner -i "$out/.first.png" -i "$out/.last.png" -lavfi ssim -f null - 2>&1 | grep -oE 'All:[0-9.]+' | tail -1 | cut -d: -f2)
  if awk "BEGIN{exit !($ss < 0.97)}"; then echo "  FAIL loop seam: last frame vs first frame SSIM $ss (< 0.97)"; fail=1; else echo "  loop seam ok (SSIM $ss)"; fi
fi

# 3. sound: spectrogram + loudness (a real score shows pitched lines with decays, not flat noise blocks)
if [ -n "$A" ]; then
  ffmpeg -loglevel error -y -i "$in" -lavfi "showspectrumpic=s=1200x240:legend=0:scale=log" "$out/audio.png"
  ffmpeg -hide_banner -i "$in" -vn -af volumedetect -f null - 2>&1 | grep -oE "(mean|max)_volume: [-0-9.]+ dB" | tr '\n' ' '; echo "(spectrogram: $out/audio.png)"
fi
ffmpeg -loglevel error -y -i "$in" -vf "fps=12/$D,scale=480:-1,tile=4x3" -frames:v 1 "$out/sheet.png"
for t in 0 ${TIMES:-} $(awk "BEGIN{printf \"%.2f\", $D/2}") $(awk "BEGIN{printf \"%.2f\", $D-0.05}"); do
  ffmpeg -loglevel error -y -ss "$t" -i "$in" -frames:v 1 -vf scale=960:-1 "$out/f-$t.png"
done
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$in" | awk -F/ '{print int($1/($2?$2:1)+0.5)}')
HALF=$(( FPS / 2 ))
echo "motion per 0.5 s (mean |frame diff|, 0-255):"
ffmpeg -loglevel error -i "$in" -vf "scale=192:108,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - 2>/dev/null \
  | grep -o 'YAVG=[0-9.]*' | cut -d= -f2 \
  | awk -v h="$HALF" '{s+=$1; n++; if (n%h==0) {v[++k]=s/h; s=0}}
      END {
        for (i=1;i<=k;i++) a[i]=v[i]; m=k; for(i=1;i<=m;i++)for(j=i+1;j<=m;j++)if(a[j]<a[i]){x=a[i];a[i]=a[j];a[j]=x}
        med=a[int((m+1)/2)]; if (med<0.05) med=0.05
        for (i=1;i<=k;i++) { t=(i-1)*0.5; flag=(v[i]>4*med && v[i]>1)?"  <-- spike":""; if (v[i]<0.005) flag="  (still)"; printf "%6.1fs %6.2f%s\n", t, v[i], flag }
        printf "median %.2f — a spike must be a planned hit; a run of (still) longer than the planned hold is a dead spot\n", med }'
echo "stills: $out"
```
