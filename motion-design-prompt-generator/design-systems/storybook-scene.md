# storybook-scene

Fits: short stories, characters, music videos and lyric clips, picture books, emotional moments, mascots acting. Not for: data, product specs.

## Palette
- One dominant mood colour for the sky and air (night `#2B3150`–`#4A4F7A`, dusk `#5B6A8F`, day `#BFD8E6`).
- Darker values of it for the ground and silhouettes.
- Two or three accents carry the story: the key object's colour, the light colour (for example warm lamp light `#F2C46D`), and skin or material tones.
- Characters are told apart by one flat colour each.

## Type
- Title: brush or serif display in the corner, vertical for Chinese (Ma Shan Zheng, Noto Serif SC 700).
- Captions: Noto Serif SC or Noto Sans SC at 40–48 px, warm white or lamp yellow, with an optional word-by-word highlight.

## Marks (SVG)
- Flat shapes with one darker shade per object for volume; corners slightly rounded.
- Characters are designed for the story, then driven by a `Body` rig. Give them their own silhouette (any shapes the story suggests), a shade side, clothing or material details, and an expressive face (eyes, brows, mouth) through `parts` and `face`. Never stick figures unless asked. Anything they hold is placed at `grip()` and drawn in `held`.
- Weather as many thin streaks (rain) or drifting dots (snow) across the whole frame, in two depths.
- Light as translucent wedge shapes under lamps, lit windows, and blurred-free reflections: vertical streaks in puddles.

## Texture
`<Paper>` at low strength or `<Grain opacity 0.06>`; soft `InkFilter` edges (`roughFor(size, 0.3)`) for a cut-paper feel when the story is gentle.

## Composition
- Occupancy: the world fills the frame and the characters about 25–40% of its height.
- Wide and locked: horizon on the lower third, characters on a third line, the story's key object at the focal point.
- Layers from back to front: sky or wall, far (skyline, hills, shelves), mid (the main set: a building, a vehicle, furniture), ground, foreground (posts, plants, puddles, objects).
- Captions in the lower third, never over a face.

## Motion character
- 60–90 BPM, character-led.
- Acting comes in small readable poses: hand over, head turns, a wave, a slump. Use `settle` with a slight `{bounce: 0.15}` for gestures only.
- Weather and ambient elements move continuously. The story's big moves (an arrival, a departure, a gift handed over, a reveal) get the most screen time.

## Transition grammar
- A single continuous shot: the story changes by action inside the world (something arrives or leaves, lights switch on, time of day shifts), not by cuts.
- A slow push-in is allowed only on the emotional beat, and returns to wide for the ending.

## Signature details
- A sign, label or object in the world that names the place or the theme.
- A written word inside the world (on fogged glass, a letter, a ticket) that echoes the caption.
- A final title card over the emptied scene.

## Sound
- Palette `ink` or `riso`.
- An `ambience` bed matching the environment (rain, wind, room) for the whole film, plus event sounds on the story's hits (`knock` for doors and objects, `boom` for vehicles or big arrivals, `drop` for water).
- An optional soft `pluck` or `pad` motif under the captions.

## Bans
Camera shake, fast cuts, gradients, glow effects (bloom, neon halos), grey captions on grey sky, characters cropped by the frame at rest.
