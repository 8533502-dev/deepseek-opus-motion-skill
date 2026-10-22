import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {FILM} from './spec';

export const Root: React.FC = () => (
  <Composition id="Film" component={Film} durationInFrames={Math.round(FILM.duration * FILM.fps)}
    fps={FILM.fps} width={FILM.width} height={FILM.height} />
);
