import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { parsePlanYaml } from "./parse";
import type { Plan } from "./types";
import { validatePlan } from "./validate";

function mustParse(text: string): Plan {
  const { plan, diagnostics } = parsePlanYaml(text);
  if (!plan) throw new Error(diagnostics.map((d) => d.message).join("; "));
  return plan;
}

test("unknown show id is an error", () => {
  const plan = mustParse(readFileSync("src/test/fixtures/bad-ref.ww.yaml", "utf8"));
  const diags = validatePlan(plan);
  expect(diags.some((d) => d.code === "unknown-ref")).toBe(true);
});

test("join diameter mismatch beyond 0.3mm is join-fit", () => {
  const plan = mustParse(readFileSync("src/test/fixtures/bad-join.ww.yaml", "utf8"));
  const diags = validatePlan(plan);
  expect(diags.some((d) => d.code === "join-fit")).toBe(true);
});

test("hole completely outside box is hole-bounds", () => {
  const plan = mustParse(`
format: woodwork/v0
id: out-hole
title: Out
summary: Hole is outside the box.
difficulty: easy
time_minutes: 1
finished_size: { x: 20, y: 20, z: 20 }
parts:
  - id: block
    kind: box
    size: { x: 10, y: 10, z: 10 }
    holes:
      - id: miss
        diameter: 2
        depth: 4
        at: { x: 50, y: 5, z: 5 }
        dir: +x
assembly:
  - part: block
    at: { x: 0, y: 0, z: 0 }
steps:
  - id: s
    title: S
    body: S
    show: [block]
`);
  expect(validatePlan(plan).some((d) => d.code === "hole-bounds")).toBe(true);
});

test("through and depth together is schema", () => {
  const { plan, diagnostics } = parsePlanYaml(`
format: woodwork/v0
id: both
title: Both
summary: Hole has through and depth.
difficulty: easy
time_minutes: 1
finished_size: { x: 20, y: 20, z: 20 }
parts:
  - id: block
    kind: box
    size: { x: 10, y: 10, z: 10 }
    holes:
      - id: bad
        diameter: 2
        through: true
        depth: 4
        at: { x: 5, y: 5, z: 5 }
        dir: +x
assembly:
  - part: block
    at: { x: 0, y: 0, z: 0 }
steps:
  - id: s
    title: S
    body: S
    show: [block]
`);
  expect(plan).toBeUndefined();
  expect(diagnostics.some((d) => d.code === "schema")).toBe(true);
});
