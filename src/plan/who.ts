import type { Plan, Step } from "./types";

// ponytail: keyword guess; set `adult: true|false` on a step to override.
const ADULT = /\b(saw|sawing|cut|cutting|drill|drilling|jigsaw|mitre|rasp)\b/i;

export function needsAdult(step: Step): boolean {
  return step.adult ?? ADULT.test(`${step.title} ${step.body}`);
}

export function hasPaint(plan: Plan): boolean {
  return plan.parts.some((p) => p.paint);
}

/** Distinct paint colours, in the order the parts appear. */
export function paintColors(plan: Plan): string[] {
  return [...new Set(plan.parts.flatMap((p) => (p.paint ? [p.paint.toLowerCase()] : [])))];
}
