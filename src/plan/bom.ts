import type { BomLine, Part, Plan } from "./types";

function dimsKey(part: Part): string {
  if (part.kind === "box") return `box|x=${part.size.x}|y=${part.size.y}|z=${part.size.z}`;
  if (part.kind === "dowel") return `dowel|d=${part.diameter}|l=${part.length}`;
  if (part.kind === "disk") return `disk|d=${part.diameter}|t=${part.thickness}`;
  return `ring|o=${part.outer}|i=${part.inner}|t=${part.thickness}`;
}

function label(part: Part): string {
  if (part.kind === "box") return `box ${part.size.x} × ${part.size.y} × ${part.size.z}mm`;
  if (part.kind === "dowel") return `dowel Ø${part.diameter} × ${part.length}mm`;
  if (part.kind === "disk") return `disk Ø${part.diameter} × ${part.thickness}mm`;
  return `ring Ø${part.outer} / Ø${part.inner} × ${part.thickness}mm`;
}

export function computeBom(plan: Plan): BomLine[] {
  const map = new Map<string, BomLine>();
  for (const part of plan.parts) {
    const key = dimsKey(part);
    const existing = map.get(key);
    if (existing) existing.qty += 1;
    else map.set(key, { key, kind: part.kind, label: label(part), qty: 1 });
  }
  return [...map.values()];
}
