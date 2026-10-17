import { expect, test } from "vitest";
import { computeBom } from "./bom";
import type { Plan } from "./types";

test("groups two identical dowels", () => {
  const plan: Plan = {
    format: "woodwork/v0",
    id: "two-pegs",
    title: "Two pegs",
    summary: "Two matching pegs.",
    difficulty: "easy",
    time_minutes: 1,
    finished_size: { x: 20, y: 20, z: 20 },
    parts: [
      { id: "a", kind: "dowel", diameter: 3, length: 16 },
      { id: "b", kind: "dowel", diameter: 3, length: 16 },
    ],
    assembly: [],
    steps: [],
  };
  const bom = computeBom(plan);
  expect(bom).toEqual([
    { key: "dowel|d=3|l=16", kind: "dowel", label: "dowel Ø3 × 16mm", qty: 2, sampleId: "a" },
  ]);
});
