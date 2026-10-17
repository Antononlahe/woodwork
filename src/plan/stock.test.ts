import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { parsePlanYaml } from "./parse";
import { computeShop, computeTools } from "./stock";
import type { Plan } from "./types";

function loadWindmill(): Plan {
  const text = readFileSync("public/plans/tabletop-windmill.ww.yaml", "utf8");
  const { plan } = parsePlanYaml(text);
  if (!plan) throw new Error("windmill did not parse");
  return plan;
}

test("windmill shop list uses EE shelf stock", () => {
  const shop = computeShop(loadWindmill());
  expect(shop.some((l) => l.kind === "ply" && l.label.includes("12 mm"))).toBe(true);
  expect(shop.some((l) => l.kind === "round" && l.label.includes("Ø8") && l.label.includes("2.4") && l.qty === 1)).toBe(
    true,
  );
  expect(shop.some((l) => l.kind === "hobby-round")).toBe(false);
  expect(shop.some((l) => l.id === "pva")).toBe(true);
  expect(shop.some((l) => l.label.toLowerCase().includes("1 m of 8"))).toBe(false);
});

test("windmill tools include the hole bits", () => {
  const tools = computeTools(loadWindmill());
  const labels = tools.map((t) => t.label).join(" ");
  expect(labels).toContain("Ø8");
  expect(labels).not.toContain("Ø5.2");
  expect(tools.every((t) => t.icon.length > 0)).toBe(true);
});

test("short Ø8 pegs become a tüübel pack", () => {
  const plan: Plan = {
    format: "woodwork/v0",
    id: "pegs",
    title: "Pegs",
    summary: "Pegs only.",
    difficulty: "easy",
    time_minutes: 5,
    finished_size: { x: 20, y: 20, z: 20 },
    parts: [
      { id: "a", kind: "dowel", diameter: 8, length: 16 },
      { id: "b", kind: "dowel", diameter: 8, length: 16 },
    ],
    assembly: [],
    steps: [],
  };
  const shop = computeShop(plan);
  expect(shop.some((l) => l.kind === "dowel-pack" && l.label.includes("8 × 40"))).toBe(true);
  expect(shop.some((l) => l.kind === "round")).toBe(false);
});
