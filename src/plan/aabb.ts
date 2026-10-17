import type { AssemblyItem, AxisDir, Part, Plan, Vec3 } from "./types";

export type Aabb = { min: Vec3; max: Vec3 };

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function rotateXyz(p: Vec3, rot: Vec3): Vec3 {
  const cx = Math.cos(degToRad(rot.x));
  const sx = Math.sin(degToRad(rot.x));
  const cy = Math.cos(degToRad(rot.y));
  const sy = Math.sin(degToRad(rot.y));
  const cz = Math.cos(degToRad(rot.z));
  const sz = Math.sin(degToRad(rot.z));

  // Rx
  let x = p.x;
  let y = p.y * cx - p.z * sx;
  let z = p.y * sx + p.z * cx;
  // Ry
  const x2 = x * cy + z * sy;
  const z2 = -x * sy + z * cy;
  x = x2;
  z = z2;
  // Rz
  const x3 = x * cz - y * sz;
  const y3 = x * sz + y * cz;
  return { x: x3, y: y3, z };
}

export function localAabb(part: Part): Aabb {
  if (part.kind === "box" || part.kind === "wedge" || part.kind === "arch" || part.kind === "merlon") {
    return { min: { x: 0, y: 0, z: 0 }, max: { ...part.size } };
  }
  if (part.kind === "dowel") {
    const r = part.diameter / 2;
    return { min: { x: -r, y: -r, z: 0 }, max: { x: r, y: r, z: part.length } };
  }
  if (part.kind === "cone") {
    const r = part.diameter / 2;
    return { min: { x: -r, y: -r, z: 0 }, max: { x: r, y: r, z: part.height } };
  }
  if (part.kind === "stairs") {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: part.run * part.count, y: part.width, z: part.rise * part.count },
    };
  }
  const r = part.kind === "ring" ? part.outer / 2 : part.diameter / 2;
  const h = part.thickness / 2;
  return { min: { x: -r, y: -r, z: -h }, max: { x: r, y: r, z: h } };
}

export function worldAabb(part: Part, item: AssemblyItem): Aabb {
  const local = localAabb(part);
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
  const rot = item.rot ?? { x: 0, y: 0, z: 0 };
  const world = corners.map((c) => {
    const r = rotateXyz(c, rot);
    return { x: r.x + item.at.x, y: r.y + item.at.y, z: r.z + item.at.z };
  });
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const p of world) {
    min.x = Math.min(min.x, p.x);
    min.y = Math.min(min.y, p.y);
    min.z = Math.min(min.z, p.z);
    max.x = Math.max(max.x, p.x);
    max.y = Math.max(max.y, p.y);
    max.z = Math.max(max.z, p.z);
  }
  return { min, max };
}

export function assembledAabb(plan: Plan): Aabb {
  const byId = new Map(plan.parts.map((p) => [p.id, p]));
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const item of plan.assembly) {
    const part = byId.get(item.part);
    if (!part) continue;
    const box = worldAabb(part, item);
    min.x = Math.min(min.x, box.min.x);
    min.y = Math.min(min.y, box.min.y);
    min.z = Math.min(min.z, box.min.z);
    max.x = Math.max(max.x, box.max.x);
    max.y = Math.max(max.y, box.max.y);
    max.z = Math.max(max.z, box.max.z);
  }
  if (!Number.isFinite(min.x)) {
    return { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
  }
  return { min, max };
}

export function aabbOverlaps(a: Aabb, b: Aabb, slack = 0.4): boolean {
  return (
    a.min.x < b.max.x - slack &&
    a.max.x > b.min.x + slack &&
    a.min.y < b.max.y - slack &&
    a.max.y > b.min.y + slack &&
    a.min.z < b.max.z - slack &&
    a.max.z > b.min.z + slack
  );
}

export function expandAabb(box: Aabb, pad: number): Aabb {
  return {
    min: { x: box.min.x - pad, y: box.min.y - pad, z: box.min.z - pad },
    max: { x: box.max.x + pad, y: box.max.y + pad, z: box.max.z + pad },
  };
}

export function rotatePointAround(p: Vec3, origin: Vec3, axis: Vec3, rad: number): Vec3 {
  const ux = p.x - origin.x;
  const uy = p.y - origin.y;
  const uz = p.z - origin.z;
  const len = Math.hypot(axis.x, axis.y, axis.z) || 1;
  const ax = axis.x / len;
  const ay = axis.y / len;
  const az = axis.z / len;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const d = ax * ux + ay * uy + az * uz;
  return {
    x: origin.x + ux * c + (ay * uz - az * uy) * s + ax * d * (1 - c),
    y: origin.y + uy * c + (az * ux - ax * uz) * s + ay * d * (1 - c),
    z: origin.z + uz * c + (ax * uy - ay * ux) * s + az * d * (1 - c),
  };
}

export function rotateAabbAround(box: Aabb, origin: Vec3, axis: Vec3, rad: number): Aabb {
  const corners: Vec3[] = [
    { x: box.min.x, y: box.min.y, z: box.min.z },
    { x: box.max.x, y: box.min.y, z: box.min.z },
    { x: box.min.x, y: box.max.y, z: box.min.z },
    { x: box.max.x, y: box.max.y, z: box.min.z },
    { x: box.min.x, y: box.min.y, z: box.max.z },
    { x: box.max.x, y: box.min.y, z: box.max.z },
    { x: box.min.x, y: box.max.y, z: box.max.z },
    { x: box.max.x, y: box.max.y, z: box.max.z },
  ];
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const c of corners) {
    const p = rotatePointAround(c, origin, axis, rad);
    min.x = Math.min(min.x, p.x);
    min.y = Math.min(min.y, p.y);
    min.z = Math.min(min.z, p.z);
    max.x = Math.max(max.x, p.x);
    max.y = Math.max(max.y, p.y);
    max.z = Math.max(max.z, p.z);
  }
  return { min, max };
}

export function extentAlong(part: Part, dir: AxisDir): number {
  const axis = dir[1] as "x" | "y" | "z";
  const box = localAabb(part);
  return box.max[axis] - box.min[axis];
}
