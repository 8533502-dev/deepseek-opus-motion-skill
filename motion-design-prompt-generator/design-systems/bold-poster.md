# bold-poster

Fits: music, sport, youth brands, fashion, festivals, campaigns. Not for: finance, heritage, calm topics.

## Palette
- Three or four saturated flat colours with roles, e.g. electric blue `#2346FF`, hot pink `#FF4FA3`, acid yellow `#E8FF3A`, and black `#0B0B0B` or white `#FFFFFF`.
- Every scene has a different background from the set.

## Type
- Ultra-heavy condensed or wide display at 900, 300–700 px, cropped by the frame: Anton, Archivo Black or Bebas Neue for Latin; ZCOOL QingKe HuangYou or Noto Sans SC 900 for Chinese.
- Stacked lines, tight leading (0.85).

## Marks (SVG)
- Flat cut-out shapes (stars, circles, arrows from `@remotion/shapes`) with no strokes.
- Photo-free collage of colour blocks.
- Stickers with a 6 px white outline.

## Texture
Optional `<Grain opacity 0.08 blend="overlay">`; flat otherwise.

## Layout
- Edge to edge. Type bleeds off the frame. Diagonals at 8–15°.
- Elements overlap; a big shape behind a big word.

## Composition
- Occupancy: 80–100%. Type and shapes bleed off edges on purpose.
- One giant element per scene; diagonals at 8–15°.

## Motion character
- 128–140 BPM. Punchy: `settle` with `{bounce: 0.3–0.6}` allowed, 0.2–0.35 s.
- Squash and stretch on landing; repeated words strobe in colour on beats; shapes spin at fixed beat steps.

## Transition grammar
- A colour block slams in from a side and becomes the next background.
- Type scales up to fill the frame, and its colour becomes the next scene.
- A shape iris-opens (`<Reveal from="circle">`) on the beat.

## Signature details
A repeating word or chant that changes colour each beat; stickers with numbers or dates; a final lock-up that shakes once on the last beat (scale, not camera).

## Sound
- Palette `poster`.
- `kick` on every beat, `clap` on 2 and 4, `hat` on eighths.
- `boom` on the final lock-up; `whoosh` on colour slams. 128–140 BPM.

## Bans
Muted palettes, thin type, long holds, crossfades, realistic shadows, generic gradients.
