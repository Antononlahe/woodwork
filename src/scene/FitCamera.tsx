import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { Box3, OrthographicCamera, Vector3 } from "three";
import type { Plan } from "../plan/types";
import { zUpToYUp } from "./coords";
import { framedIds } from "./stepView";
import { framedBox } from "./world";

const UP = new Vector3(0, 1, 0);

function isoDir(plan: Plan): Vector3 {
  const from = plan.iso_from ?? { x: 1, y: -1, z: 0.82 };
  return new Vector3(...zUpToYUp(from)).normalize();
}

function fitOrtho(box: Box3, aspect: number, margin: number, dir: Vector3): { halfW: number; halfH: number } {
  const center = box.getCenter(new Vector3());
  const right = new Vector3().crossVectors(UP, dir).normalize();
  const up = new Vector3().crossVectors(dir, right).normalize();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const corners = [
    new Vector3(box.min.x, box.min.y, box.min.z),
    new Vector3(box.max.x, box.min.y, box.min.z),
    new Vector3(box.min.x, box.max.y, box.min.z),
    new Vector3(box.max.x, box.max.y, box.min.z),
    new Vector3(box.min.x, box.min.y, box.max.z),
    new Vector3(box.max.x, box.min.y, box.max.z),
    new Vector3(box.min.x, box.max.y, box.max.z),
    new Vector3(box.max.x, box.max.y, box.max.z),
  ];
  for (const p of corners) {
    const d = p.sub(center);
    const x = d.dot(right);
    const y = d.dot(up);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  let halfW = Math.max((maxX - minX) / 2, 8) * margin;
  let halfH = Math.max((maxY - minY) / 2, 8) * margin;
  if (halfW / halfH > aspect) halfH = halfW / aspect;
  else halfW = halfH * aspect;
  return { halfW, halfH };
}

export function FitCamera({
  plan,
  stepIndex,
  view,
}: {
  plan: Plan;
  stepIndex: number;
  view: "orbit" | "iso";
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const box =
      framedBox(plan, framedIds(plan, stepIndex)) ??
      new Box3(new Vector3(-10, 0, -10), new Vector3(10, 10, 10));
    box.expandByScalar(view === "iso" ? 8 : 16);
    const center = box.getCenter(new Vector3());
    const radius = Math.max(box.getSize(new Vector3()).length() * 0.5, 16);
    const distance = radius * (view === "iso" ? 2.2 : 2.1);
    const dir = isoDir(plan);
    camera.position.copy(center).addScaledVector(dir, distance);
    camera.near = 0.1;
    camera.far = Math.max(4000, distance * 8);
    camera.lookAt(center);
    if (camera instanceof OrthographicCamera) {
      const aspect = size.width / Math.max(size.height, 1);
      const { halfW, halfH } = fitOrtho(box, aspect, 1.06, dir);
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.zoom = 1;
      camera.updateProjectionMatrix();
    } else {
      camera.updateProjectionMatrix();
    }
    if (controls && "target" in controls) {
      const orbit = controls as unknown as { target: Vector3; update: () => void };
      orbit.target.copy(center);
      orbit.update();
    }
  }, [plan, stepIndex, view, camera, controls, size.width, size.height]);

  return null;
}
