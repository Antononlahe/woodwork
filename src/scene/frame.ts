import { Box3, Vector3 } from "three";
import type { Plan } from "../plan/types";
import { zUpToYUp } from "./coords";

const UP = new Vector3(0, 1, 0);

export function isoDir(plan: Pick<Plan, "iso_from">): Vector3 {
  const from = plan.iso_from ?? { x: 1, y: -1, z: 0.82 };
  return new Vector3(...zUpToYUp(from)).normalize();
}

/** Half width/height of an orthographic frustum that holds `box` seen along `dir`. */
export function fitOrtho(box: Box3, aspect: number, margin: number, dir: Vector3): { halfW: number; halfH: number } {
  const center = box.getCenter(new Vector3());
  const right = new Vector3().crossVectors(UP, dir).normalize();
  const up = new Vector3().crossVectors(dir, right).normalize();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const d = new Vector3(x, y, z).sub(center);
        const px = d.dot(right);
        const py = d.dot(up);
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
      }
    }
  }
  let halfW = Math.max((maxX - minX) / 2, 8) * margin;
  let halfH = Math.max((maxY - minY) / 2, 8) * margin;
  if (halfW / halfH > aspect) halfH = halfW / aspect;
  else halfW = halfH * aspect;
  return { halfW, halfH };
}
