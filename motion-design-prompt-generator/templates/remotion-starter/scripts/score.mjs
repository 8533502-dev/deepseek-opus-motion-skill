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
