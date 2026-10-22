# swiss-kinetic

Fits: brand statements, launches, conferences, tech, manifestos. Not for: cosy, handmade, heritage.

## Palette
- Off-white `#F2F0EB`, near-black `#0E0E0E`, one hot accent picked for the brand (default signal red `#FF3B1F`).
- Optional support grey `#9A9A96`.
- Full-frame inversions (black ↔ white) count as scene changes.

## Type
- One grotesk: Inter Tight, Space Grotesk or Geist. 800–900 for words at 180–420 px, set tight (−0.03 to −0.05 em), often cropped by the frame.
- 500 labels at 22–26 px, tracked 0.08 em, all caps.

## Marks (SVG)
- Solid rectangles and rules (2–12 px) snapped to the grid.
- Circles only as solid dots.
- Arrows built from rules.
- No outlines on type except one deliberate outlined word.

## Texture
None, or a very light `<Grain opacity 0.05>`. Sharpness is the texture.

## Layout
- A 12-column grid: 120 px columns with 40 px gutters, margins 150 px; a baseline grid of 24 px.
- Asymmetric: hang type from the top-left column, use big negative space.
- Numbers (01, 02, 03) mark sections.

## Composition
- Occupancy: type fills 60–100% and may bleed off edges on purpose.
- Everything else snaps to the grid.
- At least 30% of the frame is empty background in every scene.

## Motion character
- 120–128 BPM. Decisive: `EASE.snap` or `EASE.out`, 0.25–0.45 s moves, no bounce.
- Words slide in on rails along grid lines, letters stagger 0.02–0.04 s.
- A block wipes on, the word appears behind it, then the block wipes off.

## Transition grammar
- Hard-edged block wipes along columns (`<Reveal from="left">` per column, staggered).
- Inversion cuts on the beat.
- A word scales until its counter (the hole in O or A) becomes the next frame.
- A rule extends to become the next scene's baseline.

## Signature details
Running section numbers; a thin ticker line at the bottom with the time code; the accent used for exactly one thing per scene.

## Sound
- Palette `swiss`.
- `kick` on bar 1, `tick` or `hat` on each beat; a short `clap` on word slams; `whoosh` on block wipes.
- No pads, or one very low drone. 120–128 BPM.

## Bans
Gradients, drop shadows, rounded cards, more than one accent, centred-title-over-three-cards, decorative icons.
