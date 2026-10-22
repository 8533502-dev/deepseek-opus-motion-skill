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
