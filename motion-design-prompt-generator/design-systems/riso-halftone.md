# riso-halftone

Fits: indie brands, zines, retro, nostalgia, playful education, small makers. Not for: corporate, luxury.

## Palette
- Two or three spot inks on paper `#F4EFE4`: fluorescent pink `#FF48B0`, blue `#0078BF`, yellow `#FFE800`, or teal `#00838A`.
- Overlaps multiply (`mixBlendMode: 'multiply'`) to make the third colour.

## Type
- Chunky grotesk or rounded at 700–900 (Space Grotesk, Archivo, or ZCOOL KuaiLe for Chinese) at 140–300 px.
- Typewriter-like mono for captions (IBM Plex Mono at 22 px).

## Marks (SVG)
- **Halftone fills:** a `<pattern>` of dots 4–10 px in pitch, with dot size scaled per area to fake tone.
- **Misregistration:** each ink layer offset 2–6 px with a slow `wobble`.
- **Shapes:** simple and blobby, drawn with flat fill.

## Texture
`<Grain opacity 0.2>`, plus a mottled ink-coverage `feTurbulence` mask on large fills (some paper shows through).

## Layout
Collage-like, slightly off-grid; elements tilted ±3°; tape and sticker motifs; borders like printed margins.

## Composition
- Occupancy: 50–80%, collage-like and slightly off-grid.
- Printed margins: 120 px paper border; nothing bleeds unless it is a page turn.

## Motion character
- 100–120 BPM, stepped: positions update on twos (`stepped(t, 12)`), which reads as hand-made.
- Mild overshoot is allowed (`bounce 0.2`). Layers slide into register on the beat.

## Transition grammar
- A page turn or slide-in of a new “sheet”.
- One ink layer wipes across and the next scene is printed in it.
- A halftone dot grows until it becomes the next background.

## Signature details
Registration crosses in the corners; a print-run counter (“№ 027 / 300”); colour separations shown briefly before they combine.

## Sound
- Palette `riso`.
- A lo-fi `pluck` figure; `knock` when a layer slides into register; `scratch` for paper slides.
- `tick` on beats. 100–120 BPM.

## Bans
Smooth gradients, glossy effects, perfect vector precision everywhere, more than three inks.
