import { Box3, Vector3 } from "three";
import { localAabb } from "../plan/aabb";
import type { Plan, Vec3 } from "../plan/types";
import { zUpToYUp } from "./coords";
import { assemblyPosition, assemblyQuaternion } from "./pose";

export function yamlToThreeVec(v: Vec3): Vector3 {
  const [x, y, z] = zUpToYUp(v);
  return new Vector3(x, y, z);
}

function splitRef(ref: string): { partId: string; holeId?: string } {
  const dot = ref.indexOf(".");
  if (dot === -1) return { partId: ref };
  return { partId: ref.slice(0, dot), holeId: ref.slice(dot + 1) };
}

export function itemForPart(plan: Plan, partId: string) {
  return plan.assembly.find((item) => item.part === partId);
}

export function localPointOnPart(plan: Plan, ref: string): Vector3 | null {
  const { partId, holeId } = splitRef(ref);
  const part = plan.parts.find((p) => p.id === partId);
  if (!part) return null;
  if (holeId) {
    const hole = part.holes?.find((h) => h.id === holeId);
    if (!hole) return null;
    return yamlToThreeVec(hole.at);
  }
  const box = localAabb(part);
  return yamlToThreeVec({
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2,
  });
}

export function worldPointOnPart(plan: Plan, ref: string): Vector3 | null {
  const { partId } = splitRef(ref);
  const item = itemForPart(plan, partId);
  const local = localPointOnPart(plan, ref);
  if (!item || !local) return null;
  return local.applyQuaternion(assemblyQuaternion(item.rot)).add(assemblyPosition(item.at));
}

export function framedBox(plan: Plan, ids: Set<string>): Box3 | null {
  const box = new Box3();
  let any = false;
  for (const item of plan.assembly) {
    if (!ids.has(item.part)) continue;
    const part = plan.parts.find((p) => p.id === item.part);
    if (!part) continue;
    const local = localAabb(part);
    const quat = assemblyQuaternion(item.rot);
    const pos = assemblyPosition(item.at);
    const corners: Vec3[] = [
      { x: local.min.x, y: local.min.y, z: local.min.z },
      { x: local.max.x, y: local.min.y, z: local.min.z },
      { x: local.min.x, y: local.max.y, z: local.min.z },
      { x: local.max.x, y: local.max.y, z: local.min.z },
      { x: local.min.x, y: local.min.y, z: local.max.z },
      { x: local.max.x, y: local.min.y, z: local.max.z },
      { x: local.min.x, y: local.max.y, z: local.max.z },
      { x: local.max.x, y: local.max.y, z: local.max.z },
    ];
    for (const c of corners) {
      box.expandByPoint(yamlToThreeVec(c).applyQuaternion(quat).add(pos));
      any = true;
    }
  }
  return any ? box : null;
}
