# Bench plans

Step-by-step 3D woodworking for a grown-up and a kid. Pick a project, buy and cut what the list says, then follow the 3D view on a tablet at the bench. Grown-up steps (saw, drill) are marked apart from kid steps (glue, sand, paint). Every project has an optional paint step.

Seven projects, from a phone stand to a tabletop castle. Windmill and car come in an easy and a harder version.

## Run

```bash
npm install
npm run dev
```

```bash
npm test             # unit tests
npm run plan:check   # lint all plans
npm run lint
npm run build
```

## Use it

- **Home**: filter by level, open a project.
- **Before you start**: finished picture, what to buy, cut list, tools, paint colours, safety.
- **Bench**: 3D model per step. Turn it or lock the angle, ←/→ keys or the big buttons, drag the divider to resize the steps panel. Your place is remembered.
- **Settings**: Day / Night / Auto, text size, paint, measurements, floor grid. Saved on the device.
- **Print**: one page per step, via the browser's Print / Save as PDF.

Works on phones, tablets and desktops. You can add it to a home screen.

## Plans

Hand-written `.ww.yaml` files in `public/plans`, listed in `catalog.json`. See `AGENTS.md` for the format.

```bash
npx tsx src/plan/cli.ts path/to/file.ww.yaml
```

You can also open a local YAML from the home screen. Nothing leaves your device.

## Deploy

The `Dockerfile` builds a static site served by nginx with SPA fallback. No environment variables. Any static host works.

## Not built

Accounts, a plan editor, units other than millimetres, inventory filters.
