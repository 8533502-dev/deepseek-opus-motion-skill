// Example: ONE rig, TWO completely different characters. The rig only places joints;
// each Body's colours, face and part overrides give it its own look. Restyle for every film.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont} from '@remotion/google-fonts/NotoSansSC';
import {Body, Canvas, Character, Pose, grip, poseMix, settle, shadeHex, useTime, walk} from './lib/motion';
const {fontFamily: SANS} = loadFont('normal', {weights: ['700']});

// ---- character A: cardboard courier (box head with flaps, tape, a sticker) ----
const boxFace: Body['face'] = ({x, y, w, h, mood, look}) => {
  const ex = w * 0.2, ey = y - h * 0.02, er = w * 0.075, lx = look * w * 0.05;
  return (
    <g>
      {[-1, 1].map((s) => <g key={s}><ellipse cx={x + s * ex + lx} cy={ey} rx={er} ry={er * 1.25} fill="#22202A" /><circle cx={x + s * ex + lx + er * 0.35} cy={ey - er * 0.4} r={er * 0.35} fill="#fff" /></g>)}
      {mood === 'sad' && [-1, 1].map((s) => <path key={s} d={`M${x + s * ex - er * 1.3} ${ey - er * 2.4 + (s === 1 ? -4 : 4)} L${x + s * ex + er * 1.3} ${ey - er * 2.4 + (s === 1 ? 4 : -4)}`} stroke="#22202A" strokeWidth={4} strokeLinecap="round" />)}
      {[-1, 1].map((s) => <ellipse key={s} cx={x + s * w * 0.33} cy={y + h * 0.16} rx={w * 0.08} ry={w * 0.05} fill="#E58C7A" opacity={0.6} />)}
      <path d={mood === 'sad' ? `M${x - w * 0.09} ${y + h * 0.27} Q${x} ${y + h * 0.19} ${x + w * 0.09} ${y + h * 0.27}` : `M${x - w * 0.09} ${y + h * 0.2} Q${x} ${y + h * 0.29} ${x + w * 0.09} ${y + h * 0.2}`} stroke="#22202A" strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
};
const COURIER: Body = {
  torso: [118, 132], head: [112, 104], upperArm: 58, foreArm: 56, thigh: 56, shin: 54, limb: 22, hand: 13, foot: 20,
  color: {body: '#C9A26B', head: '#D4AF78', limb: '#B48A55', hand: '#D4AF78', shoe: '#3A3442'},
  face: boxFace,
  parts: {
    head: ({x, y, w, h, color, shade, facing}) => (
      <g>
        <path d={`M${x - w / 2} ${y - h / 2} l${-w * 0.18} ${-h * 0.2} l${w * 0.34} ${h * 0.04} Z`} fill={shadeHex(color, 0.9)} />
        <path d={`M${x + w / 2} ${y - h / 2} l${w * 0.18} ${-h * 0.2} l${-w * 0.34} ${h * 0.04} Z`} fill={shadeHex(color, 0.9)} />
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6} fill={color} />
        <rect x={facing === 1 ? x - w / 2 : x + w / 2 - w * 0.22} y={y - h / 2} width={w * 0.22} height={h} rx={6} fill={shade} />
        <line x1={x - w / 2} x2={x + w / 2} y1={y - h * 0.36} y2={y - h * 0.36} stroke={shadeHex(color, 0.85)} strokeWidth={3} />
      </g>
    ),
    torso: ({x, y, w, h, color, shade, facing}) => (
      <g>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8} fill={color} />
        <rect x={facing === 1 ? x - w / 2 : x + w / 2 - w * 0.22} y={y - h / 2} width={w * 0.22} height={h} rx={8} fill={shade} />
        <rect x={x - w / 2} y={y - h * 0.08} width={w} height={h * 0.14} fill="#E8D7A8" opacity={0.85} />
        <rect x={x - w * 0.18} y={y + h * 0.14} width={w * 0.42} height={h * 0.2} rx={3} fill="#F4F1EA" />
        <text x={x + w * 0.03} y={y + h * 0.29} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={h * 0.12} fill="#C8463A">易碎</text>
      </g>
    ),
  },
};

// ---- character B: round paper-cut girl (round head, bob hair, A-line dress, scarf) ----
const GIRL: Body = {
  torso: [100, 120], head: [96, 96], upperArm: 54, foreArm: 50, thigh: 52, shin: 56, limb: 15, hand: 10, foot: 16,
  color: {body: '#3E7C8C', head: '#F1C9A5', limb: '#F1C9A5', hand: '#F1C9A5', shoe: '#8C2F39'},
  face: ({x, y, w, h, mood}) => (
    <g>
      {[-1, 1].map((s) => <circle key={s} cx={x + s * w * 0.17} cy={y + h * 0.04} r={w * 0.05} fill="#2A2230" />)}
      {[-1, 1].map((s) => <circle key={`c${s}`} cx={x + s * w * 0.28} cy={y + h * 0.18} r={w * 0.07} fill="#E99A8C" opacity={0.6} />)}
      <path d={mood === 'sad' ? `M${x - w * 0.07} ${y + h * 0.3} Q${x} ${y + h * 0.24} ${x + w * 0.07} ${y + h * 0.3}` : `M${x - w * 0.07} ${y + h * 0.25} Q${x} ${y + h * 0.32} ${x + w * 0.07} ${y + h * 0.25}`} stroke="#2A2230" strokeWidth={3.5} fill="none" strokeLinecap="round" />
    </g>
  ),
  parts: {
    head: ({x, y, w, h, color, shade}) => (
      <g>
        <path d={`M${x - w * 0.58} ${y + h * 0.35} Q${x - w * 0.62} ${y - h * 0.62} ${x} ${y - h * 0.6} Q${x + w * 0.62} ${y - h * 0.62} ${x + w * 0.58} ${y + h * 0.35} Z`} fill="#2B2433" />
        <circle cx={x} cy={y} r={w / 2} fill={color} />
        <path d={`M${x - w * 0.5} ${y - h * 0.05} Q${x - w * 0.1} ${y - h * 0.62} ${x + w * 0.52} ${y - h * 0.12} Q${x + w * 0.2} ${y - h * 0.32} ${x - w * 0.5} ${y - h * 0.05} Z`} fill="#2B2433" />
        <circle cx={x + w * 0.12} cy={y + h * 0.1} r={w * 0.5} fill={shade} opacity={0.15} />
      </g>
    ),
    torso: ({x, y, w, h, color, shade}) => (
      <g>
        <path d={`M${x - w * 0.3} ${y - h / 2} L${x + w * 0.3} ${y - h / 2} L${x + w * 0.62} ${y + h / 2} L${x - w * 0.62} ${y + h / 2} Z`} fill={color} />
        <path d={`M${x + w * 0.1} ${y - h / 2} L${x + w * 0.3} ${y - h / 2} L${x + w * 0.62} ${y + h / 2} L${x + w * 0.3} ${y + h / 2} Z`} fill={shade} />
        <path d={`M${x - w * 0.34} ${y - h / 2 + 4} Q${x} ${y - h / 2 + 22} ${x + w * 0.34} ${y - h / 2 + 4} L${x + w * 0.2} ${y - h * 0.18} L${x + w * 0.38} ${y + h * 0.05} L${x + w * 0.14} ${y - h * 0.1} Z`} fill="#CF4D40" />
      </g>
    ),
  },
};

const Umbrella: React.FC<{at: [number, number]; tilt?: number}> = ({at: [x, y], tilt = 0}) => {
  const top = y - 250, R = 210;
  const scallop = Array.from({length: 6}, (_, i) => { const x0 = x - R + (i * 2 * R) / 6, x1 = x0 + (2 * R) / 6; return `Q${(x0 + x1) / 2} ${top + 78} ${x1} ${top + 52}`; }).join(' ');
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <line x1={x} y1={y + 30} x2={x} y2={top - 22} stroke="#22202A" strokeWidth={6} strokeLinecap="round" />
      <path d={`M${x} ${y + 30} q0 22 -18 22`} stroke="#22202A" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M${x - R} ${top + 52} Q${x} ${top - 140} ${x + R} ${top + 52} ${scallop.replace(/Q/g, 'Q')} Z`} fill="#CF4D40" />
      <path d={`M${x - R} ${top + 52} Q${x} ${top - 140} ${x + R} ${top + 52} ${Array.from({length: 6}, (_, i) => { const x0 = x + R - (i * 2 * R) / 6, x1 = x0 - (2 * R) / 6; return `Q${(x0 + x1) / 2} ${top + 78} ${x1} ${top + 52}`; }).join(' ')} Z`} fill="#CF4D40" />
      {[-0.66, -0.33, 0, 0.33, 0.66].map((k) => <path key={k} d={`M${x} ${top - 44} Q${x + k * R * 0.7} ${top - 20} ${x + k * R * 1.02} ${top + 58}`} stroke="#A83A30" strokeWidth={3} fill="none" />)}
    </g>
  );
};

const STAND: Pose = {x: 0, y: 880, armL: [6, 8], armR: [6, 8], legL: [3, 0], legR: [-3, 0]};
const HOLD: Pose = {...STAND, armR: [128, 36]};
const OFFER: Pose = {...STAND, armR: [70, 20], mood: 'sad', head: 8};
export const Film: React.FC = () => {
  const {t, fps} = useTime();
  const courier = poseMix({...HOLD, x: 760}, {...OFFER, x: 760}, settle(t, fps, 1.0, {dur: 0.8}));
  const girl = walk(t, {...STAND, x: 1180, facing: -1, armR: [40, 30]}, 1.6, 14);
  const hand = grip(COURIER, courier, 'R');
  return (
    <AbsoluteFill style={{background: '#2E3456'}}>
      <Canvas>
        <rect x={0} y={880} width={1920} height={200} fill="#262B46" />
        <path d="M560 300 L470 880 L650 880 Z" fill="#F2C46D" opacity={0.12} />
        <rect x={556} y={260} width={8} height={620} fill="#1C2036" /><rect x={540} y={250} width={40} height={36} rx={6} fill="#F2C46D" />
        <Character body={COURIER} pose={courier} held={<Umbrella at={hand} tilt={-6 + 10 * settle(t, fps, 1.0, {dur: 0.8})} />} />
        <Character body={GIRL} pose={girl} />
        <text x={960} y={1010} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={44} fill="#F2C46D">同一套骨架 · 两种完全不同的角色</text>
      </Canvas>
    </AbsoluteFill>
  );
};
