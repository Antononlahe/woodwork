import { assembledAabb, extentAlong, localAabb } from "./aabb";
import type { AxisDir, Diagnostic, Hole, Part, Plan } from "./types";

const JOIN_TOL = 0.3;
const EPS = 1e-6;

function diag(
  level: Diagnostic["level"],
  code: string,
  path: string,
  message: string,
): Diagnostic {
  return { level, code, path, message };
}

function splitRef(ref: string): { partId: string; holeId?: string } {
  const dot = ref.indexOf(".");
  if (dot === -1) return { partId: ref };
  return { partId: ref.slice(0, dot), holeId: ref.slice(dot + 1) };
}

function findPart(plan: Plan, id: string): Part | undefined {
  return plan.parts.find((p) => p.id === id);
}

function findHole(part: Part, holeId: string): Hole | undefined {
  return part.holes?.find((h) => h.id === holeId);
}

function resolveRef(
  plan: Plan,
  ref: string,
): { part: Part; hole?: Hole } | undefined {
  const { partId, holeId } = splitRef(ref);
  const part = findPart(plan, partId);
  if (!part) return undefined;
  if (!holeId) return { part };
  const hole = findHole(part, holeId);
  if (!hole) return undefined;
  return { part, hole };
}

function pointInAabb(at: { x: number; y: number; z: number }, part: Part): boolean {
  const box = localAabb(part);
  return (
    at.x >= box.min.x - EPS &&
    at.x <= box.max.x + EPS &&
    at.y >= box.min.y - EPS &&
    at.y <= box.max.y + EPS &&
    at.z >= box.min.z - EPS &&
    at.z <= box.max.z + EPS
  );
}

function holeLength(hole: Hole, part: Part): number {
  if (hole.through) return extentAlong(part, hole.dir);
  return hole.depth ?? 0;
}

export function validatePlan(plan: Plan): Diagnostic[] {
  const out: Diagnostic[] = [];

  for (const [i, item] of plan.assembly.entries()) {
    if (!findPart(plan, item.part)) {
      out.push(diag("error", "unknown-ref", `assembly.${i}.part`, `unknown part ${item.part}`));
    }
  }

  for (const [si, step] of plan.steps.entries()) {
    for (const [j, id] of step.show.entries()) {
      if (!findPart(plan, id)) {
        out.push(diag("error", "unknown-ref", `steps.${si}.show.${j}`, `unknown part ${id}`));
      }
    }
    for (const [j, ref] of (step.highlight ?? []).entries()) {
      if (!resolveRef(plan, ref)) {
        out.push(diag("error", "unknown-ref", `steps.${si}.highlight.${j}`, `unknown ref ${ref}`));
      }
    }
    for (const [j, join] of (step.join ?? []).entries()) {
      const from = resolveRef(plan, join.from);
      const into = resolveRef(plan, join.into);
      if (!from) {
        out.push(diag("error", "unknown-ref", `steps.${si}.join.${j}.from`, `unknown ref ${join.from}`));
      }
      if (!into) {
        out.push(diag("error", "unknown-ref", `steps.${si}.join.${j}.into`, `unknown ref ${join.into}`));
      }
      if (from && into && from.part.kind === "dowel" && into.hole) {
        const delta = Math.abs(from.part.diameter - into.hole.diameter);
        if (delta > JOIN_TOL) {
          out.push(
            diag(
              "error",
              "join-fit",
              `steps.${si}.join.${j}`,
              `dowel Ø${from.part.diameter} vs hole Ø${into.hole.diameter} (tol ${JOIN_TOL}mm)`,
            ),
          );
        }
      }
    }
  }

  for (const [pi, part] of plan.parts.entries()) {
    for (const [hi, hole] of (part.holes ?? []).entries()) {
      if (!pointInAabb(hole.at, part)) {
        out.push(
          diag("error", "hole-bounds", `parts.${pi}.holes.${hi}.at`, `hole ${hole.id} is outside ${part.id}`),
        );
      }
      const span = extentAlong(part, hole.dir as AxisDir);
      if (holeLength(hole, part) > span + EPS) {
        out.push(
          diag(
            "error",
            "hole-bounds",
            `parts.${pi}.holes.${hi}`,
            `hole ${hole.id} is longer than ${part.id} along ${hole.dir}`,
          ),
        );
      }
    }
  }

  const aabb = assembledAabb(plan);
  const size = {
    x: aabb.max.x - aabb.min.x,
    y: aabb.max.y - aabb.min.y,
    z: aabb.max.z - aabb.min.z,
  };
  if (
    size.x > plan.finished_size.x + EPS ||
    size.y > plan.finished_size.y + EPS ||
    size.z > plan.finished_size.z + EPS
  ) {
    out.push(
      diag(
        "warning",
        "finished-size",
        "finished_size",
        `assembled ${size.x.toFixed(1)}×${size.y.toFixed(1)}×${size.z.toFixed(1)}mm exceeds finished_size`,
      ),
    );
  }

  return out;
}
