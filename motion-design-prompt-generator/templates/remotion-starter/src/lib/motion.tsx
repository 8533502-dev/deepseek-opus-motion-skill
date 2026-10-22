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
