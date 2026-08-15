import type { Vec3 } from "../plan/types";

export function zUpToYUp(v: Vec3): [number, number, number] {
  return [v.x, v.z, -v.y];
}

export function deg(n: number): number {
  return (n * Math.PI) / 180;
}
