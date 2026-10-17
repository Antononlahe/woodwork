import { expect, test } from "vitest";
import type { Plan } from "../plan/types";
import { currentIds, dimensionedIds, framedIds, incomingIds, visibleIds } from "./stepView";

const plan: Plan = {
  format: "woodwork/v0",
  id: "t",
  title: "T",
  summary: "T",
  difficulty: "easy",
  time_minutes: 1,
  finished_size: { x: 20, y: 20, z: 20 },
  parts: [
    { id: "a", kind: "box", size: { x: 10, y: 10, z: 4 } },
    { id: "b", kind: "dowel", diameter: 4, length: 10 },
  ],
  assembly: [],
  steps: [
    { id: "s1", title: "One", body: "One", show: ["a"] },
    { id: "s2", title: "Two", body: "Two", show: ["a", "b"] },
  ],
};

test("incoming parts are the next step additions", () => {
  expect([...incomingIds(plan, 0)]).toEqual(["b"]);
  expect(visibleIds(plan, 0)).toEqual(new Set(["a"]));
  expect(framedIds(plan, 0)).toEqual(new Set(["a", "b"]));
});

test("last construction step shows every part and no ghosts", () => {
  expect(visibleIds(plan, 1)).toBeNull();
  expect(incomingIds(plan, 1).size).toBe(0);
  expect(dimensionedIds(plan, 1).size).toBe(0);
});

test("dimensions follow only the new solid piece, not the next ghost", () => {
  expect(dimensionedIds(plan, 0)).toEqual(new Set(["a"]));
});

test("current parts are the ones added this step", () => {
  expect(currentIds(plan, 0)).toEqual(new Set(["a"]));
  expect(currentIds(plan, 1)).toEqual(new Set());
});

test("a middle step highlights only the newly shown part", () => {
  const three: Plan = {
    ...plan,
    steps: [
      ...plan.steps,
      { id: "s3", title: "Three", body: "Three", show: ["a", "b"] },
    ],
  };
  expect(currentIds(three, 1)).toEqual(new Set(["b"]));
  expect(incomingIds(three, 1).size).toBe(0);
});
