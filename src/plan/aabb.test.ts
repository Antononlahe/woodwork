import { expect, test } from "vitest";
import { assembledAabb } from "./aabb";
import type { Plan } from "./types";

test("box at origin has max = size", () => {
  const plan: Plan = {
    format: "woodwork/v0",
    id: "box",
    title: "Box",
    summary: "One box.",
    difficulty: "easy",
    time_minutes: 1,
    finished_size: { x: 40, y: 40, z: 20 },
    parts: [{ id: "block", kind: "box", size: { x: 20, y: 10, z: 4 } }],
    assembly: [{ part: "block", at: { x: 0, y: 0, z: 0 } }],
    steps: [],
  };
  expect(assembledAabb(plan)).toEqual({
    min: { x: 0, y: 0, z: 0 },
    max: { x: 20, y: 10, z: 4 },
  });
});
