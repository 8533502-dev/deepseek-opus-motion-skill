# data-instrument

Fits: explainers, finance, science, health, SaaS, any film carried by numbers or a process. Not for: pure mood pieces.

## Palette
- Paper white `#F7F7F5` or deep slate `#0F1419`, ink `#1C2430` or `#E6EDF3`.
- One data accent: `#2F6BFF` on light, `#4CC2FF` on dark.
- A second series colour, `#F2994A`, only when comparing.
- Grid and axes in ink at 15–25%.

## Type
- Inter or Geist at 600–800 for headlines (90–160 px).
- Geist Mono or IBM Plex Mono at 400–500 for numbers and labels (20–28 px), with tabular figures.

## Marks (SVG)
- 1.5–2 px axes and leader lines; 3 px data lines; 8 px dots with a 2 px ring.
- Bars with square ends.
- Diagrams are built from boxes with 8 px corners and 1.5 px strokes.
- Values roll with `<Counter>`. Lines draw on with `drawOn`.

## Texture
None, or `<Grain opacity 0.04>`. Precision is the look.

## Layout
- A 12-column grid with 150 px margins.
- One chart or diagram per scene, filling about 60% of the frame.
- Labels are attached to their marks with leader lines, never in a legend if avoidable.

## Composition
- Occupancy: one chart or diagram fills about 60% of the frame.
- Labels are attached to their marks; 150 px margins; nothing bleeds.

## Motion character
- 100–120 BPM. Axes first, then data, then the annotation, in that order.
- `EASE.out` 0.4–0.7 s; `settle` without bounce. Numbers roll with `EASE.smooth`.

## Transition grammar
- A data point becomes the next scene's origin: zoom into the point, then the point becomes a circle, then a new chart.
- A line chart's line unbends into the next scene's timeline.
- A bar grows into the full-frame background colour.

## Signature details
- A live time code and a source line in mono at the bottom.
- The key number repeated large at the end.
- Thin crosshairs that track the value being discussed.

## Sound
- Palette `data`.
- A soft `pad`; `tick` as counters roll and values land; a `bell` when the key number lands.
- `whoosh` on zoom transitions. 100–120 BPM.

## Bans
3D charts, pie charts with more than four slices, gradients, glow, invented numbers presented as real, chartjunk.
