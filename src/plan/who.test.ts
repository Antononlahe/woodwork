import { describe, expect, it } from "vitest";
import { needsAdult, paintColors } from "./who";
import type { Plan, Step } from "./types";

const step = (o: Partial<Step>): Step => ({ id: "s", title: "t", body: "b", show: ["a"], ...o });

describe("needsAdult", () => {
  it("guesses from the words", () => {
    expect(needsAdult(step({ title: "Drill the base" }))).toBe(true);
    expect(needsAdult(step({ body: "Glue the mast." }))).toBe(false);
  });
  it("lets the plan override", () => {
    expect(needsAdult(step({ title: "Cut it", adult: false }))).toBe(false);
  });
});

describe("paintColors", () => {
  it("dedupes", () => {
    const plan = {
      parts: [
        { id: "a", kind: "dowel", diameter: 1, length: 1, paint: "#AA0000" },
        { id: "b", kind: "dowel", diameter: 1, length: 1, paint: "#aa0000" },
        { id: "c", kind: "dowel", diameter: 1, length: 1 },
      ],
    } as Plan;
    expect(paintColors(plan)).toEqual(["#aa0000"]);
  });
});
