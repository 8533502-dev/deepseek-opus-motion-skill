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
