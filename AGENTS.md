# AGENTS.md

Bench plans: static web app. A grown-up and a kid follow step-by-step 3D woodworking plans. React 19, Vite, TypeScript, three.js (react-three-fiber), zod. No backend, no accounts.

## Commands

```bash
npm install
npm run dev          # vite
npm test             # vitest (node env, src/**/*.test.ts)
npm run plan:check   # lint every plan in public/plans (CI gate)
npm run lint         # oxlint
npm run build        # tsc -b && vite build
```

Before finishing: `npm test && npm run plan:check && npm run lint && npm run build`. The Dockerfile runs test, plan:check and build, so a bad plan breaks the deploy.

## Layout

- `src/plan/` pure logic, **no three.js**: schema (zod), parse, validate, bom, stock (shop list), who (grown-up/kid, paint colours).
- `src/scene/` three.js: `buildPart` (geometry + CSG holes), `PlanScene` (live view), `snapshot` (all pictures), `stepView` (what shows per step).
- `src/app/` pages (Home, Prep, Bench, Print), `Settings`, `usePlan`.
- `public/plans/*.ww.yaml` plans + `catalog.json`. `scripts/gen-castle.mjs` writes the castle YAML.
- `docs/superpowers/specs/` design notes.

## Plan format (`woodwork/v0`)

- All sizes mm. YAML is **Z-up**; three.js is Y-up. `src/scene/coords.ts` maps `(x,y,z) -> (x,z,-y)`. 1 unit = 1 mm.
- Part kinds and local frame (origin, +Z):

| kind | origin | notes |
|---|---|---|
| box, merlon | min corner | `size` |
| dowel | bottom centre | `diameter`, `length` along +Z |
| disk, ring | centre of volume | `thickness` along Z; ring has `outer`/`inner` |
| cone | base centre | `diameter`, `height` |
| wedge | min corner | gable in XZ, ridge along +Y |
| arch | min corner | wall `size`, `opening` cut through +Y |
| stairs | min corner | flight along +X |

- Any part: `paint: "#rrggbb"` (optional colour), `holes` (`through: true` xor `depth`; `dir` is `+x…-z`).
- Step: `show` lists every part visible (the last step shows all), `highlight`, `join: [{from, into}]`, optional `adult: true|false` (else guessed from words), `paint: true` marks the optional paint step (parts show their colour from here on). Put the paint step **last**.
- Refs are `partId` or `partId.holeId`.

## Validation (`validate.ts`)

Schema, unknown refs, hole inside part, dowel Ø vs hole Ø within 0.3 mm, assembled size vs `finished_size` (warning), and `spin-hit`: a dowel joined into 2+ hosts with a disk/ring spins the touching parts and fails if they sweep into fixed parts. Errors block the 3D view.

## Add a plan

1. Write `public/plans/<id>.ww.yaml` (`id` = file name without extension).
2. Add it to `public/plans/catalog.json` with the same `title`, `difficulty`, `time_minutes`. Give two entries one `family` for an easy/hard pair.
3. `npm run plan:check && npm test` (`catalog.test.ts` checks catalog and plan agree).
4. Open it in `npm run dev` and look at every step.

## Rules

- **One live `<Canvas>` (two while the finished-model zoom is open).** Cards, thumbnails, print and part pictures come from `snapshot.ts` (one offscreen renderer, queued). Never mount a `<Canvas>` per list row. A failed picture must not be cached.
- Build geometry with `buildPartCached` (CSG is slow).
- Colours and spacing come from CSS tokens in `src/index.css` (Day, Night, Auto). No hard-coded colours in components.
- Touch targets at least 44 px. Layout must hold from 360 px phones to desktop, portrait and landscape.
- Settings and progress live in `localStorage` inside try/catch. The app must work with it blocked.
- Shop terms (vineer, ümarliist, tüübel) are deliberate. Keep them.
- Write plain, short copy. Kids read it.
