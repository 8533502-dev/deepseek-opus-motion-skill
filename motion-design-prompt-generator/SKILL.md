---
name: motion-design-prompt-generator
description: Make DeepSeek (or any model) produce motion-design videos that match what Claude Opus 5.5 makes from the same prompt, for any request in any style — brand films, showreels, kinetic typography, explainers and data stories, product and UI promos, character stories and music videos, abstract loops, title sequences. It reads the prompt like Opus, derives an art direction from it, plans before coding, builds a Remotion (React + SVG) project on a tested starter with generated sound, and reviews its own work with a five-juror critique. Triggers on 动效, 动态设计, 视频, 短片, 动画, 复刻 opus 效果, 扩写提示词, Remotion, motion graphics, showreel, MV.
---

# Opus-parity motion films (Remotion)

**Goal:** the same prompt, given to Opus 5.5 and to the model running this skill, gives films that look, move and sound almost the same, whatever the subject or style.

The gap is rarely taste. It is behaviour. Opus:
- honours every value in a long prompt;
- turns vague words into concrete design decisions;
- designs every element properly instead of settling for a placeholder;
- plans the whole timeline before coding;
- builds one shared system, so things stay consistent;
- looks at its own output and fixes it.

A weaker model skips each of these unless it is made explicit. This skill makes them explicit, on the Open Design architecture:

| Open Design piece | Here |
| --- | --- |
| A functional skill that owns the workflow | This file: priorities, the stages and the element playbooks |
| A `DESIGN.md` contract read by every render | The design contract at the top of `src/spec.ts`; `design-systems/*.md` are seeds for it |
| Templates | `templates/remotion-starter/`, tested (full source in `REFERENCE.md`) |
| A Design Jury critique gate | Stage 6: five jurors, fix until each scores ≥ 8 |
| An anti-slop checklist | The ban list in stage 6 |
| Deterministic rendering | Remotion: every frame is a pure function of the frame number |

## Priority order

When rules compete for attention, keep them in this order:
1. **The prompt's own words**: every value, beat, copy line and ban.
2. **Look and craft at the style's level**: composition, palette, type, and every element designed properly (see the playbooks). Texture and light come in here too. This is what a viewer judges first.
3. **Continuity**: real transformations, persistent identity, plausible physics.
4. **Rhythm and sound.**
5. **Bookkeeping**: ledgers, tables and checks. They serve 1–4 and never replace them.

**Helpers and examples are mechanics, not style.** `motion.tsx` decides where things are and how they move. It never decides what they look like. Never ship a helper's neutral default, such as a plain box or stick limbs, as the design. Never copy an example's subject, palette or layout into a different film. Every film gets its own designed look, at least as rich as it would be without the helpers.

## Invocation

- Any request for a motion piece runs the pipeline. Ask no questions: resolve gaps in stage 1 and state them in 解读.
- **Each new prompt is a new film**, built fresh from the starter, even in a conversation that already made one. Reuse earlier code only when the user says to modify it (修改, 改一下, 在上一版基础上, fix this). In a file-tool host, create a new project folder for the film.
- **Modes.** The default is to build. 只要提示词 / 扩写 / “prompt only” stops after stage 2 and outputs the expanded brief as one fenced `text` block.
- **Hosts.** Chat-only: output files as code blocks (stage 7). With file and shell tools: write the files, run `npx tsc -p .`, `npm run render` and `npm run check`, look at the stills, fix, then report.
- If the message contains no idea, reply only: “请给我一句话的创意或一段完整的提示词。”

## Stage 0 — Read the prompt like Opus: three ledgers

- **Spec ledger** `S01…`: one row per value or instruction, quoted exactly. This covers durations, sizes, colours, fonts, weights, copy, counts, angles, positions, timings, easing, bans, the loop or ending, characters, and every storyboard beat. `FILM` in `spec.ts` (duration, fps, size) comes from these rows; the starter's placeholder values must never survive. A truncated prompt is completed in the voice and density of its last full section, with those rows marked `S##*`.
- **Transformation ledger** `X01…`: every becoming verb (becomes, turns into, gathers, dissolves, unfolds, grows into, 变成, 化成, 收拢, 汇聚, 展开) as `source → target · mechanism · start–end s · what is conserved`.
- **Element ledger** `E01…`: every thing that is drawn, typed with its playbook (type, object, character, environment, data, UI, transition, texture-light, sound) and listing:
  - three or more structural features;
  - size and coordinates;
  - how it moves;
  - for characters, the design sheet and named poses;
  - for held things, the holder over time.

  Each scene also gets its back-to-front layer list.

Every value is binding: never round, rename, recolour, re-time or drop one. The last third of a long prompt counts as much as the first. If two rows conflict, keep the more specific one and note it in 解读. In code:
- constants live in `spec.ts`, tagged `// S07`;
- builders live in `film.tsx`, tagged `// E03`;
- beats live in scene files, tagged `// S31 X02`.

## Stage 1 — Fill gaps the way Opus does

Only for what the prompt leaves open; never override a ledger row.

| Gap | Opus-like default |
| --- | --- |
| Format | 1920 × 1080; 60 fps for dense motion, 30 fps for calm or character pieces. A stated format is binding; for a quick look use `npm run preview`, never lower `FILM` |
| Duration and ending | 15 s for an idea, 30 s for a showreel or brand film. A seamless loop for reels and idents; a resolved final image or end card for stories and promos |
| Rhythm | Tempo from the mood: calm 60–90 BPM, brand 110–128, energetic 128–140. Dense pieces have an event on every beat, calm pieces on every bar. Holds ≤ 0.5 s when dense, as long as the copy needs when calm |
| Narrative | One motif or carrier connects the film; each scene grows out of the previous one; no unrelated title cards |
| Camera | Locked and front-on unless the prompt implies movement. Story pieces open wide on the whole world |
| Composition | From the style's occupancy and whitespace. Nothing at rest within 150 px of the sides or 90 px of the top and bottom |
| Typography | One family with character; the payoff word or number in the heaviest weight at the largest size. Latin: Inter, Geist, Space Grotesk, Fraunces; Chinese: Noto Sans SC, Noto Serif SC |
| Palette | 3–5 colours with roles; the accent foreshadows what comes next |
| Texture and light | Material per element, scaled to its size. Light comes from motivated sources |
| Detail | Three recurring micro-details that make the film feel authored (labels, ticks, legends, timecodes, signage). They add no new claims, numbers or copy beyond the prompt, and use the prompt's wording where it gives one |
| Captions | Any on-screen lines of speech, lyrics or subtitles: ≥ 40 px at 1080p, high contrast, lower third, whole line held for its reading window (≈ 0.25 s per Chinese character, ≈ 3 Latin words per second) |
| Sound | A generated score that fits the mood, or ambience for an environment-led scene; silent only if asked |

## Stage 2 — Direction: derive a design contract from the prompt

**Where the style comes from:**
1. **The prompt states the style** (palette, materials, type, references). The contract comes from the ledger alone.
2. **The prompt names a feeling, medium or reference** (“like a newspaper”, “水墨”, “terminal”, “Swiss poster”, “Pixar-like”). Start from the closest seed in `design-systems/` and adapt it.
3. **The prompt is a bare idea.** Synthesise a new contract with the method below. Seeds are optional starting points, not defaults.

**Style synthesis method** (for any subject):
1. **Subject → world.** What material world does this subject live in? Paper, ink, glass, metal, fabric, screens, nature, a city, a lab. Pick one, plus at most one contrasting world to transform into.
2. **Audience and mood → energy.** Calm or punchy, warm or precise, playful or serious. This sets tempo, easing, overshoot and density.
3. **Make it concrete.** Write the contract as values, not adjectives:
   - **Palette:** hex values with roles.
   - **Type:** family, weights, sizes, tracking.
   - **Marks:** how lines, fills and shapes are drawn, as SVG techniques.
   - **Texture and light:** per element.
   - **Composition:** occupancy, whitespace, edge rule.
   - **Motion character:** easing per move type.
   - **Transition grammar:** which mechanism changes which scene.
   - **Signature details.**
   - **Sound palette.**
   - **Bans.**
4. **Check against slop.** Every choice must be traceable to the subject or the prompt. Generic gradients, glows and template layouts are what the contract exists to replace.

Seeds in `design-systems/`:

| Seed | Fits |
| --- | --- |
| `drafting-table` | Process, tools, engineering |
| `swiss-kinetic` | Brands, launches, statements |
| `editorial-ink` | Culture, craft, heritage, East Asian themes |
| `data-instrument` | Explainers, finance, science |
| `bold-poster` | Music, sport, youth |
| `riso-halftone` | Indie, retro, playful |
| `storybook-scene` | Characters, stories, MVs |

**Short prompts:** write the full brief first, at Opus density. It has a direction paragraph, the contract, the structure (tempo, named scenes, scene changes), characters if any, and a scene-by-scene storyboard with timestamps and numbers. That brief becomes the ledgers. In prompt-only mode, output it and stop.

## Stage 3 — Timeline before code

1. Write one row per scene: `start–end s · name · what the viewer learns · carried element in → out · transition out (X##)`.
2. List every event as `t: element (E##) · action · numbers · ids`.
3. Name the key times in a `T` block.
4. Derive the sound cue list from the same events.

Checks before going on:
- beats fall at multiples of 60/BPM;
- each scene's exit state is the next scene's entry state;
- no two actions drive one property at once;
- everything finishes before the end;
- for a loop, the virtual t = D frame equals frame 0, with all motion at rest.

## Stage 4 — Design before motion

1. Build each element's geometry from its structural features, at module level.
2. For characters, make a **character sheet** first: one still with every character in every named pose, holding its props.
3. Fix the key compositions as exact layouts in px: frame 0, the first full frame of each scene or material, and the final frame. Check each against the contract's occupancy and whitespace.
4. Code these static states before the motion between them. A weak still is never rescued by motion. In a file-tool host, render and look at them first.

## Element playbooks

Every request is made of these element types. For each element, apply its playbook.

| Element | Build it | Move it | Check (common failure) |
| --- | --- | --- | --- |
| **Type** | One family; hierarchy by weight and size; tracking set per size; big words on one line, fitted to their stated width; split words and letters keep their spaces; CJK can run vertical | Arrive with `EASE.out`; staggers 0.02–0.06 s; slot clips, slides on rails, scale reveals; readable hold before exit | Words run together, orphan lines, captions too small or low contrast, the payoff not the heaviest type |
| **Object** (icons, props, products, symbols) | Three or more structural features of the real thing; one shade side for volume; consistent outline policy; built once as a function | Motion from its nature: paper bends at a fold, liquid ripples, metal rotates on an axis, light switches | A symbol instead of the thing, floating parts, inconsistent scale between shots |
| **Character** | A `Body` design sheet: silhouette, proportions, colours, face, marks, all designed through `color`, `face` and `parts`; named poses | `poseMix` between named poses with `settle`; `walk()` for walking; small readable acting beats; props at `grip()` and drawn in `held` | A drifting look between shots, hands not on held props, limbs through the head, stick-figure default look, feet off the ground |
| **Environment** (rooms, cities, landscapes, weather) | Layers from back to front: sky or wall, far, mid, ground, foreground. Motivated light sources and their light shapes. Weather across the frame in two depths | Ambient life that never stops (weather, lights, small loops); the camera stays still unless asked | A flat backdrop, weather passing through solid objects, missing light logic, edge-to-edge clutter |
| **Data** (charts, counters, diagrams, maps) | Axes and units first, values exact from the ledger, labels attached to marks, one chart per scene | Axes, then data, then annotation; counters roll with their mark; charts morph into each other through shared slots | Wrong numbers, unlabelled axes, decoration over data, labels that ignore the prompt's wording |
| **UI / product** | Real screens or faithful reconstructions with crisp rectangles, true proportions and a real hierarchy | Cursor-driven or state-driven changes; zooms into the region that changes | Stretched screenshots, fake interface noise, unreadable small text |
| **Transition** | Physical mechanisms: morph (`chain`), merge (`converge`), mask or wipe (`Reveal`), material change (`MaterialLayer` twice under `Reveal`), unfold, match on a shared shape | Hard edges, planned on a beat, with the source vanishing as the target forms | Crossfades, cuts the prompt didn't ask for, things popping in, identity lost across a material change |
| **Texture and light** | Paper and ink as separate layers (`Paper`, `InkFilter` scaled with `roughFor`); halftone and hatching via patterns; light as shapes (cones, lit windows, reflections) | Seeded and stable, or boiling at a fixed step rate | Uniform texture on everything, decorative glow or bloom, flicker from unseeded noise |
| **Sound** | `scripts/cues.json`: a pitched bed and figure for music, or an `ambience` bed for environment-led scenes; an event on every visual hit | Synced to the T block; a loop's tail folds into its start | Silence by omission, noise used as music, hits out of sync |

## Universal rules

1. **Becoming is real.** Every X row morphs the same object point by point (equal point counts; `chain()` for many shapes, `converge()` for many-to-one). The source is gone when the target forms. The target is fully reached: if the prompt says “becomes a bar chart”, it ends as bars. Parts are born at their source and travel. Merges and splits conserve quantity. Never fake a transformation with an overlay, a crossfade, or by scaling the whole frame.
2. **Identity persists.** An element keeps its colour, shape and slot through every scene and material change unless the prompt says otherwise. Describe shapes once as `Item`s with a palette index and render each material with `MaterialLayer`. Elements that turn into one another share a slot constant (a lane, baseline or anchor).
3. **Physics and depth are explicit.** Each scene has a back-to-front layer list. Weather respects occluders; things behind glass are tinted; reflections mirror their source; shadows share one light direction. Contacts are computed: feet on the ground, hands on what they hold.
4. **Space words are coordinates.** On 1920 × 1080, centre is (960, 540); left and right thirds are x ≈ 640 and x ≈ 1280; upper is y ≈ 360; lower is y ≈ 760. Scale for other formats.
5. **Energy is even.** On-screen change follows the tempo. Spikes are planned hits, and there are no dead seconds unless a hold is planned. Check with `npm run check`.
6. **Sound by default**, via `score.mjs` only. Music comes from pitched instruments; environments get an `ambience` bed; noise accents stay under 1 s. The script refuses a score with neither music nor ambience.
7. **Finish and check.** Write every scene completely, run the jury, and fix until every juror scores 8 or more.

## Stage 5 — Build in Remotion

```
templates/remotion-starter/ (copy once)        tested on Remotion 4.0.537 + React 19.1.0
  src/index.ts src/Root.tsx      do not change
  src/lib/motion.tsx             helpers — do not change (API below)
  src/lib/film.tsx               your builders, Body sheets, Items (E##)
  src/spec.ts                    design contract, FILM, ledger constants (S##), T block
  src/Film.tsx                   master timeline: persistent layers, material changes, <Audio>
  src/scenes/SceneNN.tsx         one file per scene, absolute timestamps
  scripts/cues.json              sound cues (you write it) · score.mjs, check.sh — do not change
```

**Rules:**
- **Time.** Only `useTime()`, where `t` is absolute seconds. No CSS animations, timers, `Date`, `Math.random` (use `rand` or `wobble`), and no state between frames.
- **No `<Sequence>` for scenes.** Every scene takes absolute `t` and returns `null` outside its window. Persistent elements are drawn once in `Film.tsx` across the whole film.
- **Easing.** Use `EASE.*` and `settle()`. Remotion's own `Easing.exp` is not exactly 0 at its start and leaks hidden layers.
- **Type.**
  - HTML for set type, with letter-spacing in em; `<Letters>` for per-letter motion.
  - SVG `<text>` for pattern fills, outlines and clips.
  - `writingMode: 'vertical-rl'` for vertical CJK.
- **Fonts.** `loadFont` from `@remotion/google-fonts/<Family>` with only the weights you use; omit `subsets` for CJK families.
- **Sound.** `FILM.sound = true` plays `public/score.wav`. `npm run studio`, `npm run preview` and `npm run render` regenerate it from `cues.json` first.
- **Completeness.** No TODOs. If space runs out, stop at the end of a file with `// CONTINUE FROM <path>`.

## Stage 6 — Design Jury

Five jurors score 1–10. Each names its worst moment with a timestamp:

1. **SPEC.** Every S, X and E row is implemented with its exact value. List missing or changed ids. This score caps the total.
2. **CONTINUITY.** Every X row is a real transformation that reaches its target, with parts born at their source. Identity and slots persist through scenes and materials. Physics and depth are correct.
3. **RHYTHM & SOUND.** Events land on beats and easing matches the contract. Energy is even, with no unplanned spikes or dead seconds. Every hit has its sound, and the loop seam is clean.
4. **DESIGN.**
   - Hero frames match their layouts; occupancy and whitespace match the contract.
   - Every element passes its playbook check. Look at stills zoomed in on type, faces, hands, props and data labels.
   - The look is designed for this film, not a helper's default or an example's.
5. **CRAFT.**
   - Texture and light are per element.
   - The film is deterministic and follows the Remotion rules.
   - Nothing from the ban list: unrequested gradients; glow effects (bloom, neon halos, lens flares); generic fade-ins; bounce where forbidden; particle bursts, camera shake, RGB split; centred-title-over-cards layouts; stock icons and emoji; placeholder copy; anything that looks like a template. Motivated light drawn as shapes is allowed.

Fix every issue from a juror below 8, worst first, up to three rounds.

In a file-tool host:
1. Run `npm run render`.
2. Run `TIMES="<key moments>" npm run check`.
3. Read `out/check/`: the sheet, the stills, `audio.png` and the motion curve.

Every `FAIL` line must be fixed: a format mismatch, a leftover placeholder spec, missing audio, a frame 0 colour flash, a bad loop seam. Trust the stills over the code.

## Stage 7 — Output

**Chat-only host.** Reply in this order:
1. **解读** (user's language, ≤ 6 lines): the style source, assumptions, conflicts, inferred `S##*` rows.
2. **Ledgers and timeline** in one fenced `text` block (S, X and E rows, scene rows, the T block), kept for later fix rounds.
3. **Files**, each as a code block headed by its path: `src/spec.ts`, `src/lib/film.tsx`, `src/Film.tsx`, every `src/scenes/SceneNN.tsx`, `scripts/cues.json`. Print starter files only if the user has no starter folder, copied verbatim from `REFERENCE.md`.
4. **Parity table:**
   - `X## · source → target · helper · file`;
   - `E## · playbook · features drawn · builder · identity kept across materials`, plus each character's poses and props over time;
   - `format · W×H fps duration · S##`.

   Any X row done by overlay, crossfade or whole-frame scaling is a failure: fix it before replying.
5. **Jury:** five scores, and the three things you are least sure of.
6. **运行方法** (user's language):
   - 复制 skill 包里的 `templates/remotion-starter` 文件夹，把文件放进对应位置（不用的 `src/scenes/Scene01.tsx` 删掉）。
   - `npm install`；如果提示 esbuild 需要批准，运行 `npm approve-scripts esbuild && npm rebuild esbuild`。
   - `npm run studio` 预览，`npm run preview` 出半分辨率小样，`npm run render` 导出 `out/film.mp4`，`npm run check` 自查。
   - 有问题就截图发我，说“评审修复”。

**Follow-ups.** 继续 → only the remaining files. 评审修复 → run stage 6 on the stills or code, then output only the changed files, in full.

**File-tool host.** Create the project from the starter, write the files, then run `npx tsc -p .`, `npm run render` and `npm run check`. Run the jury on the stills, fix, and report the folder, the scores and the MP4 path.

## Helper API (`src/lib/motion.tsx`) — the full source is in `REFERENCE.md`

```text
Time      useTime() → {t, fps, frame, D, width, height} · prog(t, start, dur, ease) 0..1
          settle(t, fps, landing, {lead=0.05, dur=0.45, bounce}) spring that lands on a beat
          EASE.out / in / inOut (exact expo) · smooth · snap · linear · mix(a, b, p)
          beats(bpm).at(n) / .bar(n) / .index(t) · rand(seed) · wobble(seed, i, t) · stepped(t, perSecond)
Shapes    Pt = [x, y] · polygon(cx, cy, r, sides, rot, n=96) · circle(cx, cy, r, n) · line(x1, y1, x2, y2, n)
          toPath(pts, closed) · morphPts(a, b, p) · morphPath(dA, dB, p) · drawOn(d, p) → spread on <path>
Transform chain(t, [{at, dur, pts, ease}, …]) one object through many shapes
          converge(t, [{pts, arrive, mass, travel}], target, {baseRadius, radiusPerMass}) → {shapes, radius}
Materials Item = {d, c, w?} | {text, x, y, size, font, weight?, c, anchor?, spacing?}  (c = palette index)
          <MaterialLayer items material palette id/> material: {kind:'flat'} | {kind:'paper', shadow, shadowOpacity, edge}
          | {kind:'line'|'glass', width, fill} | {kind:'halftone', inks:[hex…], pitch, offset, angle:[deg…]}
          inkCoverage(hex, inks) → coverage per ink
Characters Body = {torso:[w,h], head:[w,h], upperArm, foreArm, thigh, shin, limb, hand, foot,
          color:{body, head, limb, hand?, shoe?, shade?, line?}, face?(box), parts?{head, torso, limb, hand, foot}(box)}
          Pose = {x, y (ground), facing ±1, lean, head, mood, look, armL/armR:[shoulder, elbow], legL/legR:[hip, knee]}
          angles in degrees: shoulder 0 down · 90 forward · 180 up; elbow bends forward; knee bends back
          <Character body pose back held front/> · grip(body, pose, 'L'|'R') hand point · nearSide(pose)
          poseMix(a, b, p) · walk(t, base, stepsPerSecond, swing) · shadeHex(hex, k) · rig(body, pose) joints
Texture   <Paper color grain fibre/> · <InkFilter id edge grain boil seed/> (filter="url(#id)") · roughFor(sizePx, strength)
          <RoughFilter id scale freq step/> · <Grain opacity freq blend/> · <Grid pitch major color/>
Layout    <Stage bg/> · <Canvas> full-frame SVG · <Reveal p from="left|right|top|bottom|circle" at/>
          <Letters text t start stagger dur ease style(p, i) box/> (keeps spaces) · <Counter from to p decimals/>
Sound     scripts/cues.json {duration, bpm, loop, palette, bed[], patterns[], events[]} → npm run score
          instruments: pluck bell pad ambience(rain|wind|room) tick kick clap hat whoosh drop knock scratch boom
Commands  npm run studio · preview · render · check (format, frame 0, loop seam, sound, motion curve)
```
