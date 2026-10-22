import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Canvas, Grain, Grid, Letters, Reveal, RoughFilter, Stage, beats, circle, drawOn, line, morphPts, polygon, prog, settle, toPath, useTime, EASE} from './lib/motion';
import {BARS, FONT, INK, SAFE} from './spec';

type Ink = typeof INK.paper;
const B = beats(120);

// One scene drawn in a given ink. Every value derives from t, so the same scene can be re-drawn in another ink under a mask.
const Scene: React.FC<{ink: Ink; name: keyof typeof INK}> = ({ink, name}) => {
  const {t, fps} = useTime();
  const pencil = name === 'paper';
  // carrier: line -> circle -> hexagon
  const a = line(560, 760, 1360, 760), c = circle(960, 540, 235), h = polygon(960, 540, 270, 6);
  const pts = morphPts(morphPts(a, c, settle(t, fps, 3.0)), h, settle(t, fps, 4.0));
  const d = toPath(pts, t > 2.9);
  return (
    <Stage bg={ink.bg}>
      <Grid color={ink.grid} />
      {pencil && <Grain opacity={0.18} />}
      <Canvas>
        <defs>
          <RoughFilter id={`rough-${name}`} scale={pencil ? 2.5 : 0} />
          <pattern id={`hatch-${name}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={pencil ? ink.accent : ink.line} strokeWidth={pencil ? 2 : 1.2} />
          </pattern>
        </defs>
        <g filter={`url(#rough-${name})`}>
          {t < 2.6 && (
            <text x="960" y="640" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={330}
              fill={`url(#hatch-${name})`} stroke={pencil ? ink.accent : ink.line} strokeWidth={3}
              style={{clipPath: `inset(0 0 ${prog(t, 2.0, 0.5, EASE.in) * 100}% 0)`}}>CLAUDE</text>
          )}
          <path d={d} fill={t > 4.2 ? `url(#hatch-${name})` : 'none'} stroke={ink.line} strokeWidth={4} strokeLinejoin="round"
            {...(t < 1 ? drawOn(toPath(a, false), prog(t, 0.2, 0.7)) : {})} />
        </g>
      </Canvas>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <div style={{position: 'absolute', left: SAFE.x, top: SAFE.y, fontSize: 24, fontWeight: 700, letterSpacing: '0.2em', color: pencil ? ink.line : ink.line}}>
          FIG. {String(Math.min(Math.floor(B.index(t) / 4), 3) + 1).padStart(2, '0')} — {BARS[Math.min(Math.floor(B.index(t) / 4), 3)]}
        </div>
        <div style={{position: 'absolute', right: SAFE.x, bottom: SAFE.y, fontSize: 24, fontWeight: 700, letterSpacing: '0.2em', color: ink.line}}>
          BEAT {B.index(t) + 1} / 16
        </div>
        <Letters text="INTRODUCING" t={t} start={0.1} stagger={0.03} dur={0.3}
          box={{position: 'absolute', top: 260, width: '100%', justifyContent: 'center', fontSize: 26, fontWeight: 700, letterSpacing: '0.2em', color: ink.accent}}
          style={(p) => ({opacity: p > 0 ? 1 : 0, transform: `translateY(${(1 - p) * 30}px)`})} />
      </AbsoluteFill>
    </Stage>
  );
};

export const Film: React.FC = () => {
  const {t} = useTime();
  const flood = prog(t, 4.6, 0.4, EASE.in);             // paper -> blueprint, circle flood from centre
  const scan = prog(t, 6.0, 0.5, EASE.inOut);           // blueprint -> hologram, scan from top
  return (
    <AbsoluteFill>
      <Scene ink={INK.paper} name="paper" />
      <Reveal p={flood} from="circle" at={[960, 540]}><Scene ink={INK.blueprint} name="blueprint" /></Reveal>
      <Reveal p={scan} from="top"><Scene ink={INK.holo} name="holo" /></Reveal>
      {scan > 0 && scan < 1 && <AbsoluteFill style={{top: scan * 1080 - 2, height: 4, background: INK.holo.line}} />}
    </AbsoluteFill>
  );
};
