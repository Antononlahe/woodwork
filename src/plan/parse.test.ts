import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { parsePlanYaml } from "./parse";

test("parses a minimal valid plan", () => {
  const text = readFileSync("src/test/fixtures/ok-minimal.ww.yaml", "utf8");
  const { plan, diagnostics } = parsePlanYaml(text);
  expect(diagnostics.filter((d) => d.level === "error")).toEqual([]);
  expect(plan?.id).toBe("ok-minimal");
  expect(plan?.parts[0].kind).toBe("box");
});

test("rejects unknown format", () => {
  const { plan, diagnostics } = parsePlanYaml("format: nope\nid: x\n");
  expect(plan).toBeUndefined();
  expect(diagnostics.some((d) => d.code === "schema")).toBe(true);
});

test("paint must be #rrggbb", () => {
  const text = readFileSync("src/test/fixtures/ok-minimal.ww.yaml", "utf8");
  const ok = parsePlanYaml(text.replace("kind: box", 'kind: box\n    paint: "#aa22cc"'));
  expect(ok.diagnostics.filter((d) => d.level === "error")).toEqual([]);
  const bad = parsePlanYaml(text.replace("kind: box", "kind: box\n    paint: red"));
  expect(bad.plan).toBeUndefined();
});
