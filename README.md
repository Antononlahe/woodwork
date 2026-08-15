# Bench plans

A 3D bench guide for simple woodworking with kids. v0.1 ships one tabletop windmill and a YAML plan format (`woodwork/v0`).

## Run

```bash
npm install
npm test
npm run plan:check
npm run dev
```

Open the windmill, step through the build, toggle isometric / 3D, then Print / Save as PDF.

## Plans

Hand-written `.ww.yaml` files in `public/plans`. Lint and 3D checks:

```bash
npm run plan:check
npx tsx src/plan/cli.ts path/to/file.ww.yaml
```

You can also open a local YAML from the home screen. Nothing is stored on a server.

## Coolify

Deploy the `Dockerfile`. No environment variables. The image is nginx serving the static build, with SPA fallback.

## v0.1

In: catalog, local YAML, windmill example, materials, step 3D, iso/orbit, print.

Out: accounts, kid-mode, tool suggestions, plan editor, inventory filters.
