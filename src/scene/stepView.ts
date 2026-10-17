import type { Plan } from "../plan/types";

export function visibleIds(plan: Plan, stepIndex: number): Set<string> | null {
  if (stepIndex >= plan.steps.length - 1) return null;
  return new Set(plan.steps[stepIndex].show);
}

export function highlightRefs(plan: Plan, stepIndex: number): Set<string> {
  if (stepIndex >= plan.steps.length) return new Set();
  return new Set(plan.steps[stepIndex].highlight ?? []);
}

export function incomingIds(plan: Plan, stepIndex: number): Set<string> {
  if (stepIndex >= plan.steps.length - 1) return new Set();
  const current = new Set(plan.steps[stepIndex].show);
  const next =
    stepIndex + 1 < plan.steps.length
      ? new Set(plan.steps[stepIndex + 1].show)
      : new Set(plan.parts.map((p) => p.id));
  const extra = new Set<string>();
  for (const id of next) {
    if (!current.has(id)) extra.add(id);
  }
  return extra;
}

export function nextJoins(plan: Plan, stepIndex: number) {
  if (stepIndex + 1 < plan.steps.length) return plan.steps[stepIndex + 1].join ?? [];
  return [];
}

function partKindKey(plan: Plan, id: string): string {
  const part = plan.parts.find((p) => p.id === id);
  if (!part) return id;
  if (part.kind === "box" || part.kind === "wedge" || part.kind === "merlon") {
    return `${part.kind}|${part.size.x}x${part.size.y}x${part.size.z}`;
  }
  if (part.kind === "arch") {
    return `arch|${part.size.x}x${part.size.y}x${part.size.z}|${part.opening.width}x${part.opening.height}`;
  }
  if (part.kind === "stairs") return `stairs|${part.width}x${part.rise}x${part.run}x${part.count}`;
  if (part.kind === "dowel") return `dowel|${part.diameter}x${part.length}`;
  if (part.kind === "cone") return `cone|${part.diameter}x${part.height}`;
  if (part.kind === "disk") return `disk|${part.diameter}x${part.thickness}`;
  return `ring|${part.outer}x${part.inner}x${part.thickness}`;
}

/**
 * The pieces this step is about: parts shown for the first time, or when assembling
 * (nothing new), the parts that were not in view in the step before.
 */
export function currentIds(plan: Plan, stepIndex: number): Set<string> {
  if (stepIndex >= plan.steps.length - 1) return new Set();
  const fresh = firstSeenIds(plan, stepIndex);
  if (fresh.size > 0) return fresh;
  const shown = visibleIds(plan, stepIndex);
  if (!shown) return new Set();
  if (stepIndex === 0) return new Set(shown);
  const prev = new Set(plan.steps[stepIndex - 1].show);
  const added = new Set<string>();
  for (const id of shown) {
    if (!prev.has(id)) added.add(id);
  }
  return added;
}

/** Parts shown for the first time in this step (not just re-shown). */
export function firstSeenIds(plan: Plan, stepIndex: number): Set<string> {
  const seen = new Set<string>();
  for (let i = 0; i < stepIndex; i++) for (const id of plan.steps[i].show) seen.add(id);
  return new Set((plan.steps[stepIndex]?.show ?? []).filter((id) => !seen.has(id)));
}

/** Solid parts that just appeared this step. One sample per identical size. No ghosts. */
export function dimensionedIds(plan: Plan, stepIndex: number): Set<string> {
  const added = currentIds(plan, stepIndex);
  const samples = new Set<string>();
  const seen = new Set<string>();
  for (const id of added) {
    const key = partKindKey(plan, id);
    if (seen.has(key)) continue;
    seen.add(key);
    samples.add(id);
  }
  return samples;
}

export function highlightedHoleIds(plan: Plan, stepIndex: number, partId: string): string[] {
  const holes: string[] = [];
  for (const ref of highlightRefs(plan, stepIndex)) {
    const [pid, hid] = ref.split(".");
    if (pid === partId && hid) holes.push(hid);
  }
  return holes;
}

export function framedIds(plan: Plan, stepIndex: number): Set<string> {
  const shown = visibleIds(plan, stepIndex);
  if (!shown) return new Set(plan.parts.map((p) => p.id));
  const ids = new Set(shown);
  for (const id of incomingIds(plan, stepIndex)) ids.add(id);
  return ids;
}
