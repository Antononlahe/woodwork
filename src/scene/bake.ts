import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from "three";
import type { Plan } from "../plan/types";
import { buildPart, woodColor } from "./buildPart";
import { assemblyPosition, assemblyQuaternion } from "./pose";

export async function bakeStepImages(plan: Plan): Promise<string[]> {
  const width = 1200;
  const height = 800;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height, false);
  renderer.setClearColor(new Color("#e8d7b8"));

  const scene = new Scene();
  scene.add(new AmbientLight(0xffffff, 0.75));
  const sun = new DirectionalLight(0xffffff, 1.1);
  sun.position.set(120, 220, 80);
  scene.add(sun);

  const built = new Map(plan.parts.map((p) => [p.id, buildPart(p)]));
  const groups: { id: string; mesh: Mesh }[] = [];
  for (const item of plan.assembly) {
    const part = plan.parts.find((p) => p.id === item.part);
    const builtPart = built.get(item.part);
    if (!part || !builtPart) continue;
    const mesh = new Mesh(
      builtPart.geometry,
      new MeshStandardMaterial({ color: woodColor(part), roughness: 0.82 }),
    );
    mesh.position.copy(assemblyPosition(item.at));
    mesh.quaternion.copy(assemblyQuaternion(item.rot));
    scene.add(mesh);
    groups.push({ id: part.id, mesh });
  }

  const camera = new OrthographicCamera(-180, 180, 120, -120, 0.1, 4000);
  camera.position.set(260, 260, 260);
  camera.lookAt(40, 80, -40);

  const count = plan.steps.length + 1;
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    const show = i >= plan.steps.length ? null : new Set(plan.steps[i].show);
    for (const g of groups) g.mesh.visible = !show || show.has(g.id);
    renderer.render(scene, camera);
    urls.push(canvas.toDataURL("image/png"));
  }

  renderer.dispose();
  return urls;
}
