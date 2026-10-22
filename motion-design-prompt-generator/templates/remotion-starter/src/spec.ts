// spec.ts — the film's contract. Every number, colour, font and copy line the prompt states lives here, once,
// tagged with its ledger id (S01, S02, ...). Scenes read from here; they never hard-code a value the prompt gave.
import {loadFont} from '@remotion/google-fonts/Inter';
const {fontFamily} = loadFont('normal', {weights: ['400', '600', '800'], subsets: ['latin']});

export const FILM = {duration: 10, fps: 60, width: 1920, height: 1080, bpm: 120, sound: true}; // S01 (sound: public/score.wav from scripts/cues.json)
export const SAFE = {x: 150, y: 90};                                               // S02
export const FONT = fontFamily;                                                    // S03
export const COLOR = {bg: '#F4F1EA', ink: '#111111', accent: '#E4572E'};           // S04
export const COPY = {title: 'TITLE', sub: 'SUBTITLE'};                             // S05
