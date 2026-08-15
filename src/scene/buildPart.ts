import { BoxGeometry, CylinderGeometry, type BufferGeometry, Vector3 } from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import type { AxisDir, Hole, Part, Vec3 } from "../plan/types";

export type BuiltPart = {
  geometry: BufferGeometry;
  extras: BufferGeometry[];
};

function yamlToThree(v: Vec3): Vector3 {
  return new Vector3(v.x, v.z, -v.y);
}

function dirToThree(dir: AxisDir): Vector3 {
  const map: Record<AxisDir, Vec3> = {
    "+x": { x: 1, y: 0, z: 0 },
    "-x": { x: -1, y: 0, z: 0 },
    "+y": { x: 0, y: 1, z: 0 },
    "-y": { x: 0, y: -1, z: 0 },
    "+z": { x: 0, y: 0, z: 1 },
    "-z": { x: 0, y: 0, z: -1 },
  };
  return yamlToThree(map[dir]);
}

function solidGeometry(part: Part): BufferGeometry {
  if (part.kind === "box") {
    const g = new BoxGeometry(part.size.x, part.size.z, part.size.y);
    g.translate(part.size.x / 2, part.size.z / 2, -part.size.y / 2);
    return g;
  }
  if (part.kind === "dowel") {
    const g = new CylinderGeometry(part.diameter / 2, part.diameter / 2, part.length, 24);
    g.translate(0, part.length / 2, 0);
    return g;
  }
  if (part.kind === "disk") {
    return new CylinderGeometry(part.diameter / 2, part.diameter / 2, part.thickness, 32);
  }
  return new CylinderGeometry(part.outer / 2, part.outer / 2, part.thickness, 32);
}

function holeLength(part: Part, hole: Hole): number {
  if (hole.through) {
    if (part.kind === "box") {
      const axis = hole.dir[1] as "x" | "y" | "z";
      return part.size[axis] + 4;
    }
    if (part.kind === "dowel") return Math.max(part.diameter, part.length) + 4;
    if (part.kind === "disk") return part.thickness + 4;
    return Math.max(part.outer, part.thickness) + 4;
  }
  return (hole.depth ?? 0) + 2;
}

function holeBrush(part: Part, hole: Hole): Brush {
  const length = holeLength(part, hole);
  const geo = new CylinderGeometry(hole.diameter / 2, hole.diameter / 2, length, 20);
  const brush = new Brush(geo);
  const origin = yamlToThree(hole.at);
  const dir = dirToThree(hole.dir).normalize();
  brush.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir);
  const offset = hole.through ? 0 : length / 2 - 1;
  brush.position.copy(origin).addScaledVector(dir, offset);
  brush.updateMatrixWorld();
  return brush;
}

function subtractHoles(solid: BufferGeometry, part: Part): BuiltPart {
  const extras: BufferGeometry[] = [];
  const holes = [...(part.holes ?? [])];
  if (part.kind === "ring") {
    holes.unshift({
      id: "__inner",
      diameter: part.inner,
      at: { x: 0, y: 0, z: 0 },
      dir: "+z",
      through: true,
    });
  }
  if (holes.length === 0) return { geometry: solid, extras };

  try {
    const evaluator = new Evaluator();
    let result = new Brush(solid);
    result.updateMatrixWorld();
    for (const hole of holes) {
      result = evaluator.evaluate(result, holeBrush(part, hole), SUBTRACTION);
    }
    return { geometry: result.geometry, extras };
  } catch {
    for (const hole of holes) extras.push(holeBrush(part, hole).geometry);
    return { geometry: solid, extras };
  }
}

export function woodColor(part: Part): string {
  if (part.kind === "dowel") return "#c4a574";
  if (part.kind === "ring") return "#b08968";
  if (part.kind === "disk") return "#c9a27a";
  return "#d4b483";
}

export function buildPart(part: Part): BuiltPart {
  return subtractHoles(solidGeometry(part), part);
}
