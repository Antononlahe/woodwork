import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Part, Plan } from "../plan/types";
import { buildPartCached } from "./buildPart";
import { fitOrtho, isoDir } from "./frame";
import { partMaterial } from "./look";
import { assemblyPosition, assemblyQuaternion } from "./pose";
import { currentIds, framedIds, visibleIds } from "./stepView";
import { framedBox } from "./world";

/**
 * Every picture that isn't the live 3D view comes from ONE offscreen renderer, one at a time.
 * Phones lose WebGL contexts fast; a canvas per card or per list row goes blank.
 */
let renderer: WebGLRenderer | undefined;
let queue: Promise<unknown> = Promise.resolve();
const caches = new WeakMap<object, Map<string, Promise<string>>>();

function getRenderer(): WebGLRenderer {
  if (!renderer) {
    renderer = new WebGLRenderer({
      canvas: document.createElement("canvas"),
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor(0x000000, 0);
  }
  return renderer;
}

function lit(scene: Scene) {
  scene.add(new AmbientLight(0xffffff, 0.95));
  scene.add(new HemisphereLight(0xfff4dd, 0xc4a574, 0.55));
  const sun = new DirectionalLight(0xffffff, 0.9);
  sun.position.set(120, 220, 80);
  scene.add(sun);
  const fill = new DirectionalLight(0xffffff, 0.35);
  fill.position.set(-80, 80, -40);
  scene.add(fill);
}

type Job = { group: Group; box?: Box3; dir: Vector3; w: number; h: number; margin?: number };

function draw({ group, box, dir, w, h, margin = 1.1 }: Job): string {
  const gl = getRenderer();
  const scene = new Scene();
  lit(scene);
  scene.add(group);
  group.updateMatrixWorld(true);
  const frame = box ?? new Box3().setFromObject(group);
  const center = frame.getCenter(new Vector3());
  const radius = Math.max(frame.getSize(new Vector3()).length() / 2, 16);
  const { halfW, halfH } = fitOrtho(frame, w / h, margin, dir);
  const cam = new OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, radius * 8);
  cam.position.copy(center).addScaledVector(dir, radius * 3);
  cam.lookAt(center);
  gl.setSize(w, h, false);
  gl.render(scene, cam);
  const url = gl.domElement.toDataURL("image/webp", 0.92);
  group.traverse((o) => {
    if (o instanceof Mesh) (o.material as MeshStandardMaterial).dispose();
  });
  return url;
}

function cached(owner: object, key: string, make: () => string): Promise<string> {
  let map = caches.get(owner);
  if (!map) caches.set(owner, (map = new Map()));
  let hit = map.get(key);
  if (!hit) {
    // One at a time, and a tick apart so the page stays responsive while cards fill in.
    hit = queue.then(() => new Promise<string>((ok, no) => setTimeout(() => {
      try {
        ok(make());
      } catch (e) {
        no(e);
      }
    }, 0)));
    queue = hit.catch(() => undefined);
    map.set(key, hit);
  }
  return hit;
}

function planGroup(plan: Plan, show: Set<string> | null, painted: boolean, hot?: Set<string>): Group {
  const group = new Group();
  const byId = new Map(plan.parts.map((p) => [p.id, p]));
  for (const item of plan.assembly) {
    const part = byId.get(item.part);
    if (!part || (show && !show.has(part.id))) continue;
    const mat = partMaterial(part, painted);
    if (hot?.has(part.id)) {
      mat.emissive.set("#e06712");
      mat.emissiveIntensity = 0.3;
    }
    const mesh = new Mesh(buildPartCached(part).geometry, mat);
    mesh.position.copy(assemblyPosition(item.at));
    mesh.quaternion.copy(assemblyQuaternion(item.rot));
    group.add(mesh);
  }
  return group;
}

/** The finished build, framed to fit. Used for cards, the prep screen and the corner picture. */
export function finishedImage(plan: Plan, painted: boolean, w = 640, h = 420): Promise<string> {
  return cached(plan, `done|${painted}|${w}x${h}`, () => {
    const all = new Set(plan.parts.map((p) => p.id));
    return draw({
      group: planGroup(plan, null, painted),
      box: framedBox(plan, all) ?? undefined,
      dir: isoDir(plan),
      w,
      h,
    });
  });
}

/** One picture per step, plus the finished one last. For the print sheets. */
export async function stepImages(plan: Plan): Promise<string[]> {
  const out: string[] = [];
  for (const [i, step] of plan.steps.entries()) {
    out.push(
      await cached(plan, `step|${i}`, () =>
        draw({
          group: planGroup(plan, visibleIds(plan, i), !!step.paint, currentIds(plan, i)),
          box: framedBox(plan, framedIds(plan, i)) ?? undefined,
          dir: isoDir(plan),
          w: 1200,
          h: 800,
          margin: 1.2,
        }),
      ),
    );
  }
  out.push(await finishedImage(plan, plan.parts.some((p) => p.paint), 1200, 800));
  return out;
}

const PART_DIR = new Vector3(1, 0.8, 1).normalize();

/** A single part on its own, for the materials list. */
export function partImage(part: Part, painted: boolean): Promise<string> {
  return cached(part, `part|${painted}`, () => {
    const group = new Group();
    group.add(new Mesh(buildPartCached(part).geometry, partMaterial(part, painted)));
    return draw({ group, dir: PART_DIR, w: 240, h: 240, margin: 1.2 });
  });
}

/** Any hand-built object (shop stock). `owner` must be a long-lived object: the cache hangs off it. */
export function objectImage(owner: object, key: string, build: () => Group, w = 240, h = 240): Promise<string> {
  return cached(owner, key, () => draw({ group: build(), dir: PART_DIR, w, h, margin: 1.25 }));
}
