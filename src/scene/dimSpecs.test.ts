import { expect, test } from "vitest";
import { formatDia, formatMm, partDimSpecs } from "./dimSpecs";

test("formats millimetres without junk decimals", () => {
  expect(formatMm(80)).toBe("80");
  expect(formatMm(5.2)).toBe("5.2");
  expect(formatDia(8)).toBe("Ø8");
});

test("box gets three overall sizes", () => {
  const dims = partDimSpecs({ id: "base", kind: "box", size: { x: 80, y: 80, z: 12 } }, false);
  expect(dims.map((d) => d.label).sort()).toEqual(["12", "80", "80"]);
});

test("dowel gets length and diameter", () => {
  const dims = partDimSpecs({ id: "mast", kind: "dowel", diameter: 8, length: 140 }, false);
  expect(dims.map((d) => d.label)).toEqual(["140", "Ø8"]);
});

test("hole callout includes depth", () => {
  const dims = partDimSpecs({
    id: "base",
    kind: "box",
    size: { x: 80, y: 80, z: 12 },
    holes: [{ id: "mast-socket", diameter: 8, depth: 8, at: { x: 40, y: 40, z: 12 }, dir: "-z" }],
  });
  expect(dims.some((d) => d.label === "Ø8 × 8")).toBe(true);
});
