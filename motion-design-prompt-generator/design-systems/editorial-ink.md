# editorial-ink

Fits: culture, food and tea, books, craft, heritage, Chinese and East Asian themes, slow luxury. Not for: tech launches, sport.

## Palette
- Rice paper `#F3EEE3`, ink black `#1A1814`.
- Washes of ink grey `#1A1814` at 8–40% opacity.
- Seal red `#B8322A` as the only accent.
- Optional tea or ochre `#A7774A`.

## Type
- Serif with character. Latin: Fraunces at 300–600, or Noto Serif SC for Chinese, at 120–260 px.
- Captions in Noto Sans SC or Inter at 400, 22–26 px, tracked 0.1 em.
- Vertical Chinese text (`writingMode: 'vertical-rl'`) for titles is welcome.

## Marks (SVG)
- **Brush strokes:** a path stroked 10–40 px with round caps, drawn on with `drawOn`. Dry edges come from `<InkFilter edge={roughFor(size)} grain={0.3–0.5}>`: crisper and denser for near or small marks, softer and fainter for far or large ones.
- **Ink washes and mountains:** layered shapes from far to near, at 15–40% opacity far and 80–90% near, each layer with its own `InkFilter` seed. Washes spread by morphing outward from a drop, not by scaling.
- **Mist:** thin horizontal dry strokes 10–25 px tall at 10–15% opacity that drift slowly. Never blurred blobs.
- **Seals:** a red rounded square with white or knocked-out characters.

## Texture
`<Paper color>` (grain plus long fibres). Ink carries its own grain through `InkFilter`; the two textures stay separate.

## Layout
Generous negative space; asymmetric, with the subject on a third. Columns of vertical text; a seal near a corner of the title.

## Composition
- Occupancy: the subject is within about 60% of the width.
- At least 50% of the frame is empty paper; nothing bleeds.
- Mist and washes stay inside the safe area.
- Title on the right or left third, never centred over the subject.

## Motion character
- 60–80 BPM; breathing, never snappy. `EASE.smooth` over 0.8–1.6 s.
- Ink spreads with `EASE.out`. Holds of 1–2 s are allowed for reading.
- No overshoot.

## Transition grammar
- An ink wash spreads until it fills the frame, then thins into the next scene's paper.
- A brush stroke sweeps across as a wipe.
- A shape (a leaf, a mountain) dissolves into wash and re-forms as the next shape.

## Signature details
- A seal that stamps on beat 1 of the title.
- Small vertical captions with dates or places.
- One slow drifting element: steam, a petal, mist.

## Sound
- Palette `ink`.
- A low `pad` drone on the root; `pluck` on a pentatonic scale (for example D E F# A B) once per bar.
- `drop` for ink drops and water; `knock` for seals and stamps; brush strokes as a light `scratch`.
- 60–80 BPM, long reverb.

## Bans
Neon, gradients, glossy 3D, fast cuts, sans-serif titles, emoji, more than one red element per scene.
