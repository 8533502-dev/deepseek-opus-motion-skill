# drafting-table

Fits: designers, creative tools, process, engineering, “how it's made”. Not for: luxury, emotional storytelling, food.

## Palette
- PAPER: bg `#EDE6D5`, graphite line `#16161A`, accent blue `#1B3ED2`.
- BLUEPRINT: bg `#1B3ED2`, line `#FFFFFF`, accent cyan `#45F0DD`.
- HOLOGRAM: bg `#07080A`, line `#45F0DD`, white core `#FFFFFF`.
- Rule: each material's accent is the next material's main colour.

## Type
Geist only. 900 for big words; 600–800 for labels at 24–28 px, tracked 0.14–0.3 em.

## Marks (SVG)
- **Paper:** pencil strokes 4 px with `RoughFilter` (scale 2–3, step 8). Fills are a 45° `<pattern>` of 2 px blue lines on an 8–9 px pitch. Big type is pattern-filled `<text>` with a stroke.
- **Blueprint:** clean 3–4 px white lines; hidden edges 2 px dashed `10 8`; fine 1.2 px hatching.
- **Hologram:** a cyan stroke plus a white stroke at 30% of its width on top. Fills are horizontal lines on an 8 px pitch; thicker means more lit. No blur.

## Texture
`<Grain opacity 0.15–0.2>` on paper only. A 60 px grid at 13%, every fifth line at 26%, drawn in the current material.

## Layout
Locked camera, front-on. Safe area 150 / 90 px. Compositions are centred, with ruler-like rails.

## Composition
- Occupancy: the subject fills 40–70% of the width.
- Centred and symmetric; construction marks extend out from it.
- No bleed except a scan line or a flood mask in transit.

## Motion character
120 BPM. An event on every beat. `settle` with no overshoot, lead 0.05 s. `EASE.in` for presses and drops, `EASE.inOut` for scans. Holds ≤ 0.5 s.

## Transition grammar
- A carrier line morphs through shapes (line → circle → polygon → tiles).
- Paper → blueprint: a shape floods the frame (`<Reveal from="circle">`).
- Blueprint → hologram and back: one horizontal scan line (`<Reveal from="top">` plus a drawn 4 px line).
- Cubes unfold into dashboard panels.

## Signature details
- Corner labels: “FIG. 07 — GEAR” top left, “BEAT 27 / 60” bottom right.
- Pen-tool handles labelled EASE, ruler ticks, dimension lines with live numbers, gears labelled 16T.
- Charts that describe the film itself.
- A small box mascot holding a pencil.

## Sound
- Palette `drafting`.
- Pencil `scratch` under each line drawn on; `tick` on every beat.
- `knock` on presses and claps; `whoosh` on floods and scans; a soft `pad` bed.
- 120 BPM.

## Bans
Particles, glows, lens flares, camera shake, RGB split, crossfades, gradients, bounce.
