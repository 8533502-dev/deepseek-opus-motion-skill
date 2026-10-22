# Example: one rig, two different characters (mechanics only)

This example shows how to drive characters, not how a character should look.
- A cardboard courier and a girl in a paper-cut style use the same skeleton.
- Their look comes entirely from each `Body`: colours, `face`, and the `parts` overrides for head and torso.
- The umbrella is placed at `grip()` and drawn in `held`, so the hand closes over the shaft. It stays in the hand as the pose blends from holding up to offering.

For a real film, design new characters from its prompt and style. Do not reuse these.
`poses.png` is a frame rendered from this file.

To run it, copy `src/Film.tsx` over the starter's file, set `FILM` in `src/spec.ts` to `{duration: 2, fps: 30, width: 1920, height: 1080, bpm: 80, sound: false}`, then run `npx remotion studio`.
