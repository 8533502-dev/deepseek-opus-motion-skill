// The film's contract: every number the prompt states lives here, once.
import {loadFont} from '@remotion/google-fonts/Geist';
const {fontFamily} = loadFont('normal', {weights: ['600', '700', '900'], subsets: ['latin']});

export const FILM = {duration: 8, fps: 60, width: 1920, height: 1080, bpm: 120};
export const SAFE = {x: 150, y: 90};
export const FONT = fontFamily;
export const INK = {
  paper: {bg: '#EDE6D5', line: '#16161A', accent: '#1B3ED2', grid: '#1B3ED2'},
  blueprint: {bg: '#1B3ED2', line: '#FFFFFF', accent: '#45F0DD', grid: '#FFFFFF'},
  holo: {bg: '#07080A', line: '#45F0DD', accent: '#FFFFFF', grid: '#45F0DD'},
};
export const BARS = ['DRAFT', 'MORPH', 'SCAN', 'END'];
