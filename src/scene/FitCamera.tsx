import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { Box3, OrthographicCamera, PerspectiveCamera, Vector3 } from "three";
import type { Plan } from "../plan/types";
import { fitOrtho, isoDir } from "./frame";
import { framedIds } from "./stepView";
import { framedBox } from "./world";

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
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const box =
      framedBox(plan, framedIds(plan, stepIndex)) ??
      new Box3(new Vector3(-10, 0, -10), new Vector3(10, 10, 10));
    box.expandByScalar(view === "iso" ? 8 : 16);
    const center = box.getCenter(new Vector3());
    const radius = Math.max(box.getSize(new Vector3()).length() * 0.5, 16);
    const dir = isoDir(plan);
    const aspect = size.width / Math.max(size.height, 1);
    let distance = radius * 2.2;
    if (camera instanceof PerspectiveCamera) {
      // Fit the box as seen along `dir`, wide or tall screen alike, then back off by its depth.
      const { halfW, halfH } = fitOrtho(box, aspect, 1.1, dir);
      const tan = Math.tan((camera.fov * Math.PI) / 360);
      distance = Math.max(halfH / tan, halfW / (tan * aspect)) + radius * 0.65;
      camera.aspect = aspect;
    }
    camera.position.copy(center).addScaledVector(dir, distance);
    camera.near = 0.1;
    camera.far = Math.max(4000, distance * 8);
    camera.lookAt(center);
    if (camera instanceof OrthographicCamera) {
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
    invalidate();
  }, [plan, stepIndex, view, camera, controls, invalidate, size.width, size.height]);

  return null;
}
