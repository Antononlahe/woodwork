import type { BomLine, Part, Plan } from "./types";

export function partKey(part: Part): string {
  if (part.kind === "box") return `box|x=${part.size.x}|y=${part.size.y}|z=${part.size.z}`;
  if (part.kind === "dowel") return `dowel|d=${part.diameter}|l=${part.length}`;
  if (part.kind === "disk") return `disk|d=${part.diameter}|t=${part.thickness}`;
  if (part.kind === "cone") return `cone|d=${part.diameter}|h=${part.height}`;
  if (part.kind === "wedge") return `wedge|x=${part.size.x}|y=${part.size.y}|z=${part.size.z}`;
  if (part.kind === "arch") {
    return `arch|x=${part.size.x}|y=${part.size.y}|z=${part.size.z}|o=${part.opening.width}x${part.opening.height}`;
  }
  if (part.kind === "stairs") {
    return `stairs|w=${part.width}|r=${part.rise}|n=${part.run}|c=${part.count}`;
  }
  if (part.kind === "merlon") return `merlon|x=${part.size.x}|y=${part.size.y}|z=${part.size.z}`;
  return `ring|o=${part.outer}|i=${part.inner}|t=${part.thickness}`;
}

export function partLabel(part: Part): string {
  if (part.kind === "box") return `box ${part.size.x} × ${part.size.y} × ${part.size.z}mm`;
  if (part.kind === "dowel") return `dowel Ø${part.diameter} × ${part.length}mm`;
  if (part.kind === "disk") return `disk Ø${part.diameter} × ${part.thickness}mm`;
  if (part.kind === "cone") return `cone Ø${part.diameter} × ${part.height}mm`;
  if (part.kind === "wedge") return `wedge ${part.size.x} × ${part.size.y} × ${part.size.z}mm`;
  if (part.kind === "arch") {
    return `arch ${part.size.x} × ${part.size.y} × ${part.size.z}mm, opening ${part.opening.width} × ${part.opening.height}`;
  }
  if (part.kind === "stairs") {
    return `stairs ${part.count}× ${part.run} × ${part.rise}mm`;
  }
  if (part.kind === "merlon") return `merlon ${part.size.x} × ${part.size.y} × ${part.size.z}mm`;
  return `ring Ø${part.outer} / Ø${part.inner} × ${part.thickness}mm`;
}

export function computeBom(plan: Plan): BomLine[] {
  const map = new Map<string, BomLine>();
  for (const part of plan.parts) {
    const key = partKey(part);
    const existing = map.get(key);
    if (existing) existing.qty += 1;
    else map.set(key, { key, kind: part.kind, label: partLabel(part), qty: 1, sampleId: part.id });
  }
  return [...map.values()];
}
