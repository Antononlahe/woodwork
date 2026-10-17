import type { Hole, Part, Vec3 } from "../plan/types";

export type DimSpec = {
  id: string;
  a: Vec3;
  b: Vec3;
  offset: Vec3;
  label: string;
};

export function formatMm(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatDia(n: number): string {
  return `Ø${formatMm(n)}`;
}

function gapFor(...sizes: number[]): number {
  const min = Math.min(...sizes.filter((n) => n > 0));
  return Math.max(7, Math.min(min * 0.22, 16));
}

function holeDims(partId: string, hole: Hole): DimSpec[] {
  const r = hole.diameter / 2;
  const g = Math.max(6, hole.diameter);
  const at = hole.at;
  const axis = hole.dir[1] as "x" | "y" | "z";
  const label = hole.through || hole.depth === undefined ? formatDia(hole.diameter) : `${formatDia(hole.diameter)} × ${formatMm(hole.depth)}`;

  if (axis === "z") {
    return [
      {
        id: `${partId}.${hole.id}`,
        a: { x: at.x - r, y: at.y, z: at.z },
        b: { x: at.x + r, y: at.y, z: at.z },
        offset: { x: 0, y: g, z: 0 },
        label,
      },
    ];
  }
  if (axis === "y") {
    return [
      {
        id: `${partId}.${hole.id}`,
        a: { x: at.x - r, y: at.y, z: at.z },
        b: { x: at.x + r, y: at.y, z: at.z },
        offset: { x: 0, y: 0, z: g },
        label,
      },
    ];
  }
  return [
    {
      id: `${partId}.${hole.id}`,
      a: { x: at.x, y: at.y - r, z: at.z },
      b: { x: at.x, y: at.y + r, z: at.z },
      offset: { x: 0, y: 0, z: g },
      label,
    },
  ];
}

export function partDimSpecs(part: Part, holes = true): DimSpec[] {
  const dims: DimSpec[] = [];
  if (part.kind === "box" || part.kind === "wedge" || part.kind === "arch" || part.kind === "merlon") {
    const { x, y, z } = part.size;
    const g = gapFor(x, y, z);
    dims.push(
      { id: `${part.id}-x`, a: { x: 0, y: 0, z: 0 }, b: { x, y: 0, z: 0 }, offset: { x: 0, y: -g, z: 0 }, label: formatMm(x) },
      { id: `${part.id}-y`, a: { x, y: 0, z: 0 }, b: { x, y, z: 0 }, offset: { x: g, y: 0, z: 0 }, label: formatMm(y) },
      { id: `${part.id}-z`, a: { x: 0, y: 0, z: 0 }, b: { x: 0, y: 0, z }, offset: { x: -g, y: 0, z: 0 }, label: formatMm(z) },
    );
  } else if (part.kind === "stairs") {
    const x = part.run * part.count;
    const y = part.width;
    const z = part.rise * part.count;
    const g = gapFor(x, y, z);
    dims.push(
      { id: `${part.id}-x`, a: { x: 0, y: 0, z: 0 }, b: { x, y: 0, z: 0 }, offset: { x: 0, y: -g, z: 0 }, label: formatMm(x) },
      { id: `${part.id}-y`, a: { x, y: 0, z: 0 }, b: { x, y, z: 0 }, offset: { x: g, y: 0, z: 0 }, label: formatMm(y) },
      { id: `${part.id}-z`, a: { x: 0, y: 0, z: 0 }, b: { x: 0, y: 0, z }, offset: { x: -g, y: 0, z: 0 }, label: formatMm(z) },
    );
  } else if (part.kind === "cone") {
    const r = part.diameter / 2;
    const g = gapFor(part.diameter, part.height);
    dims.push(
      {
        id: `${part.id}-d`,
        a: { x: -r, y: 0, z: 0 },
        b: { x: r, y: 0, z: 0 },
        offset: { x: 0, y: 0, z: -g },
        label: formatDia(part.diameter),
      },
      {
        id: `${part.id}-h`,
        a: { x: 0, y: 0, z: 0 },
        b: { x: 0, y: 0, z: part.height },
        offset: { x: r + g, y: 0, z: 0 },
        label: formatMm(part.height),
      },
    );
  } else if (part.kind === "dowel") {
    const r = part.diameter / 2;
    const g = gapFor(part.diameter, part.length);
    dims.push(
      {
        id: `${part.id}-l`,
        a: { x: 0, y: 0, z: 0 },
        b: { x: 0, y: 0, z: part.length },
        offset: { x: r + g, y: 0, z: 0 },
        label: formatMm(part.length),
      },
      {
        id: `${part.id}-d`,
        a: { x: -r, y: 0, z: part.length / 2 },
        b: { x: r, y: 0, z: part.length / 2 },
        offset: { x: 0, y: r + g, z: 0 },
        label: formatDia(part.diameter),
      },
    );
  } else if (part.kind === "disk") {
    const r = part.diameter / 2;
    const h = part.thickness / 2;
    const g = gapFor(part.diameter, part.thickness);
    dims.push(
      {
        id: `${part.id}-d`,
        a: { x: -r, y: 0, z: 0 },
        b: { x: r, y: 0, z: 0 },
        offset: { x: 0, y: 0, z: h + g },
        label: formatDia(part.diameter),
      },
      {
        id: `${part.id}-t`,
        a: { x: r, y: 0, z: -h },
        b: { x: r, y: 0, z: h },
        offset: { x: g, y: 0, z: 0 },
        label: formatMm(part.thickness),
      },
    );
  } else {
    const ro = part.outer / 2;
    const ri = part.inner / 2;
    const h = part.thickness / 2;
    const g = gapFor(part.outer, part.inner, part.thickness);
    dims.push(
      {
        id: `${part.id}-out`,
        a: { x: -ro, y: 0, z: 0 },
        b: { x: ro, y: 0, z: 0 },
        offset: { x: 0, y: 0, z: h + g },
        label: formatDia(part.outer),
      },
      {
        id: `${part.id}-in`,
        a: { x: -ri, y: 0, z: 0 },
        b: { x: ri, y: 0, z: 0 },
        offset: { x: 0, y: 0, z: -(h + g) },
        label: formatDia(part.inner),
      },
      {
        id: `${part.id}-t`,
        a: { x: ro, y: 0, z: -h },
        b: { x: ro, y: 0, z: h },
        offset: { x: g, y: 0, z: 0 },
        label: formatMm(part.thickness),
      },
    );
  }

  if (holes) {
    for (const hole of part.holes ?? []) dims.push(...holeDims(part.id, hole));
  }
  return dims;
}
