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

const spinBlocker = `
format: woodwork/v0
id: spin-block
title: Spin block
summary: A vane that hits the deck when it turns.
difficulty: easy
time_minutes: 1
finished_size: { x: 120, y: 40, z: 80 }
parts:
  - id: bearing
    kind: box
    size: { x: 20, y: 12, z: 20 }
    holes:
      - id: shaft
        diameter: 8
        through: true
        at: { x: 10, y: 0, z: 10 }
        dir: +y
  - id: deck
    kind: box
    size: { x: 20, y: 12, z: 20 }
  - id: shaft
    kind: dowel
    diameter: 8
    length: 36
  - id: hub
    kind: disk
    diameter: 20
    thickness: 8
    holes:
      - id: bore
        diameter: 8
        through: true
        at: { x: 0, y: 0, z: 0 }
        dir: +z
  - id: vane
    kind: box
    size: { x: 12, y: 4, z: 70 }
assembly:
  - part: bearing
    at: { x: -10, y: 16, z: 10 }
  - part: deck
    at: { x: 30, y: 4, z: 10 }
  - part: shaft
    at: { x: 0, y: 0, z: 20 }
    rot: { x: -90, y: 0, z: 0 }
  - part: hub
    at: { x: 0, y: 8, z: 20 }
    rot: { x: -90, y: 0, z: 0 }
  - part: vane
    at: { x: -6, y: 6, z: -15 }
steps:
  - id: s
    title: S
    body: S
    show: [bearing, deck, shaft, hub, vane]
    join:
      - from: shaft
        into: bearing.shaft
      - from: shaft
        into: hub.bore
`;

test("a vane that hits the house when it turns is spin-hit", () => {
  const plan = mustParse(spinBlocker);
  const diags = validatePlan(plan);
  expect(diags.some((d) => d.code === "spin-hit")).toBe(true);
});

test("catalog plans do not spin into themselves", () => {
  const files = [
    "public/plans/tabletop-castle.ww.yaml",
    "public/plans/tabletop-windmill.ww.yaml",
    "public/plans/toy-car.ww.yaml",
    "public/plans/phone-stand.ww.yaml",
    "public/plans/tabletop-rocket.ww.yaml",
  ];
  for (const file of files) {
    const plan = mustParse(readFileSync(file, "utf8"));
    const hits = validatePlan(plan).filter((d) => d.code === "spin-hit");
    expect(hits, file).toEqual([]);
  }
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

test("a part listed twice in one step is a warning", () => {
  const plan = mustParse(readFileSync("src/test/fixtures/ok-minimal.ww.yaml", "utf8"));
  plan.steps[0].show = [plan.steps[0].show[0], plan.steps[0].show[0]];
  expect(validatePlan(plan).some((d) => d.code === "duplicate-show" && d.level === "warning")).toBe(true);
});
