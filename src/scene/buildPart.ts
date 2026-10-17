import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import type { AxisDir, Hole, Part, Vec3 } from "../plan/types";

export type BuiltPart = {
  geometry: BufferGeometry;
  extras: BufferGeometry[];
  /** Crisp outline of the uncut solid. EdgesGeometry on CSG output draws stray triangle lines. */
  outline: BufferGeometry;
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

function wedgeGeometry(size: Vec3): BufferGeometry {
  const { x: sx, y: sy, z: sz } = size;
  const hx = sx / 2;
  const positions = [
    0, 0, 0, sx, 0, 0, sx, 0, -sy, 0, 0, -sy, hx, sz, 0, hx, sz, -sy,
  ];
  const index = [
    0, 1, 2, 0, 2, 3, 0, 4, 1, 1, 4, 5, 1, 5, 2, 3, 2, 5, 3, 5, 4, 0, 3, 4,
  ];
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function stairsGeometry(part: Extract<Part, { kind: "stairs" }>): BufferGeometry {
  const pieces: BufferGeometry[] = [];
  for (let i = 0; i < part.count; i++) {
    const g = new BoxGeometry(part.run, part.rise, part.width);
    g.translate(part.run / 2 + i * part.run, part.rise / 2 + i * part.rise, -part.width / 2);
    pieces.push(g);
  }
  const merged = mergeGeometries(pieces, false);
  for (const g of pieces) g.dispose();
  return merged ?? new BoxGeometry(part.run, part.rise, part.width);
}

function archGeometry(part: Extract<Part, { kind: "arch" }>): BufferGeometry {
  const wall = new BoxGeometry(part.size.x, part.size.z, part.size.y);
  wall.translate(part.size.x / 2, part.size.z / 2, -part.size.y / 2);
  const r = part.opening.width / 2;
  const jamb = Math.max(part.opening.height - r, 2);
  const slot = new BoxGeometry(part.opening.width, jamb, part.size.y + 6);
  slot.translate(part.size.x / 2, jamb / 2, -part.size.y / 2);
  const cyl = new CylinderGeometry(r, r, part.size.y + 6, 28);
  cyl.rotateX(Math.PI / 2);
  cyl.translate(part.size.x / 2, jamb, -part.size.y / 2);
  try {
    const evaluator = new Evaluator();
    let result = new Brush(wall);
    result.updateMatrixWorld();
    const slotBrush = new Brush(slot);
    slotBrush.updateMatrixWorld();
    result = evaluator.evaluate(result, slotBrush, SUBTRACTION);
    const cylBrush = new Brush(cyl);
    cylBrush.updateMatrixWorld();
    result = evaluator.evaluate(result, cylBrush, SUBTRACTION);
    const geometry = result.geometry;
    geometry.deleteAttribute("normal");
    geometry.computeVertexNormals();
    return geometry;
  } catch {
    return wall;
  }
}

function solidGeometry(part: Part): BufferGeometry {
  if (part.kind === "box" || part.kind === "merlon") {
    const g = new BoxGeometry(part.size.x, part.size.z, part.size.y);
    g.translate(part.size.x / 2, part.size.z / 2, -part.size.y / 2);
    return g;
  }
  if (part.kind === "wedge") return wedgeGeometry(part.size);
  if (part.kind === "arch") return archGeometry(part);
  if (part.kind === "stairs") return stairsGeometry(part);
  if (part.kind === "dowel") {
    const g = new CylinderGeometry(part.diameter / 2, part.diameter / 2, part.length, 24);
    g.translate(0, part.length / 2, 0);
    return g;
  }
  if (part.kind === "cone") {
    const g = new ConeGeometry(part.diameter / 2, part.height, 32);
    g.translate(0, part.height / 2, 0);
    return g;
  }
  if (part.kind === "disk") {
    return new CylinderGeometry(part.diameter / 2, part.diameter / 2, part.thickness, 32);
  }
  return new CylinderGeometry(part.outer / 2, part.outer / 2, part.thickness, 32);
}

function holeLength(part: Part, hole: Hole): number {
  if (hole.through) {
    if (part.kind === "box" || part.kind === "wedge" || part.kind === "arch" || part.kind === "merlon") {
      const axis = hole.dir[1] as "x" | "y" | "z";
      return part.size[axis] + 4;
    }
    if (part.kind === "stairs") {
      const span = { x: part.run * part.count, y: part.width, z: part.rise * part.count };
      return span[hole.dir[1] as "x" | "y" | "z"] + 4;
    }
    if (part.kind === "dowel") return Math.max(part.diameter, part.length) + 4;
    if (part.kind === "cone") return Math.max(part.diameter, part.height) + 4;
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
  const outline = new EdgesGeometry(solid, 25);
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
  if (holes.length === 0) return { geometry: solid, extras, outline };

  try {
    const evaluator = new Evaluator();
    let result = new Brush(solid);
    result.updateMatrixWorld();
    for (const hole of holes) {
      result = evaluator.evaluate(result, holeBrush(part, hole), SUBTRACTION);
    }
    const geometry = result.geometry;
    geometry.deleteAttribute("normal");
    geometry.computeVertexNormals();
    return { geometry, extras, outline };
  } catch {
    for (const hole of holes) extras.push(holeBrush(part, hole).geometry);
    return { geometry: solid, extras, outline };
  }
}

export function woodColor(part: Part, painted = false): string {
  if (painted && part.paint) return part.paint;
  if (part.kind === "dowel") return "#c4a574";
  if (part.kind === "ring") return "#b08968";
  if (part.kind === "disk") return "#c9a27a";
  if (part.kind === "cone") return "#b88958";
  if (part.kind === "wedge") return "#c9a06a";
  if (part.kind === "arch") return "#d0b07a";
  if (part.kind === "stairs") return "#c4a070";
  if (part.kind === "merlon") return "#c2a06c";
  return "#d4b483";
}

export function buildPart(part: Part): BuiltPart {
  return subtractHoles(solidGeometry(part), part);
}

// Parts are plain objects from one parsed plan, so identity is a safe key.
const built = new WeakMap<Part, BuiltPart>();

/** CSG is slow: build each part once for the scene, thumbnails and print. */
export function buildPartCached(part: Part): BuiltPart {
  let hit = built.get(part);
  if (!hit) {
    hit = buildPart(part);
    built.set(part, hit);
  }
  return hit;
}
