# Woodwork v0.1 design

Tabletop woodworking bench app for parents and kids. Used during the build. 3D is the guide. Print is the paper backup.

## Decisions

- Static Vite + React + TypeScript. No backend, no accounts.
- Plans are hand-written `.ww.yaml` (`woodwork/v0`). English. All sizes in mm.
- Catalog ships in `public/plans`. A local YAML can be opened in the browser.
- `src/plan` parses, lints, and validates with no Three.js.
- `src/scene` builds meshes from a valid plan (Z-up YAML → Y-up Three, 1 unit = 1 mm).
- Kinds: `box`, `dowel`, `disk`, `ring`. BOM is computed from `parts`.
- Join fit tolerance: 0.3 mm. Schema errors block the scene. Warnings still render.
- Views: orbit (perspective) and isometric (locked ortho).
- Print: baked step images + browser Print / Save as PDF.
- First example: tabletop windmill (~15–25 cm) with a spinning shaft.
- Host: Coolify, nginx image of `dist`.
- Out of v0.1: kid-mode, tools, authoring UI, inventory filters, accounts, JPG zip.

## Format

See `public/plans/tabletop-windmill.ww.yaml` for the full example.

Local frames:

| kind | origin | +Z |
|---|---|---|
| box | min corner | height |
| dowel | bottom center | along length |
| disk | center of volume | thickness |
| ring | center of volume | thickness |

Holes: `dir` is `+x`/`-x`/`+y`/`-y`/`+z`/`-z`. `through: true` xor `depth`. Refs: `partId` or `partId.holeId`.

## Validation

1. Zod schema
2. Unknown refs
3. Hole inside part; through xor depth
4. Join: dowel Ø vs hole Ø within 0.3 mm
5. Warning if assembled AABB exceeds `finished_size`

## Screens

- `/` catalog + open file
- `/p/:id` bench
- `/p/:id/print` print
- `/local` and `/local/print` for an uploaded plan
