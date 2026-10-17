import { expect, test } from "vitest";
import type { Plan } from "../plan/types";
import { framedBox, worldPointOnPart } from "./world";

const plan: Plan = {
  format: "woodwork/v0",
  id: "t",
  title: "T",
  summary: "T",
  difficulty: "easy",
  time_minutes: 1,
  finished_size: { x: 40, y: 40, z: 20 },
  parts: [
    {
      id: "block",
      kind: "box",
      size: { x: 20, y: 10, z: 4 },
      holes: [{ id: "h", diameter: 4, depth: 4, at: { x: 10, y: 5, z: 4 }, dir: "-z" }],
    },
  ],
  assembly: [{ part: "block", at: { x: 0, y: 0, z: 0 } }],
  steps: [],
};

test("frames only the named part", () => {
  const box = framedBox(plan, new Set(["block"]));
  expect(box).not.toBeNull();
  const size = box!.getSize(box!.min.clone());
  expect(size.x).toBeCloseTo(20);
  expect(size.y).toBeCloseTo(4);
  expect(size.z).toBeCloseTo(10);
});

test("resolves a hole in three-space", () => {
  const p = worldPointOnPart(plan, "block.h");
  expect(p).not.toBeNull();
  expect(p!.x).toBeCloseTo(10);
  expect(p!.y).toBeCloseTo(4);
  expect(p!.z).toBeCloseTo(-5);
});
