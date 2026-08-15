import { expect, test } from "vitest";
import { zUpToYUp } from "./coords";

test("maps z-up workshop coords to three y-up", () => {
  expect(zUpToYUp({ x: 1, y: 2, z: 3 })).toEqual([1, 3, -2]);
});
