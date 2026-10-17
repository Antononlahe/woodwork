import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePlanYaml } from "./parse";
import { validatePlan } from "./validate";

type Entry = { id: string; file: string; title: string; difficulty: string; time_minutes: number; family?: string };
const entries = JSON.parse(readFileSync("public/plans/catalog.json", "utf8")) as Entry[];

describe("catalog", () => {
  it("has unique ids", () => {
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  for (const entry of entries) {
    it(`${entry.id} matches its plan and is valid`, () => {
      const parsed = parsePlanYaml(readFileSync(`public/plans/${entry.file}`, "utf8"));
      expect(parsed.diagnostics.filter((d) => d.level === "error")).toEqual([]);
      const plan = parsed.plan!;
      expect(plan.id).toBe(entry.id);
      expect(plan.title).toBe(entry.title);
      expect(plan.difficulty).toBe(entry.difficulty);
      expect(plan.time_minutes).toBe(entry.time_minutes);
      expect(validatePlan(plan).filter((d) => d.level === "error")).toEqual([]);
    });
  }

  it("keeps each family to one project at different levels", () => {
    const byFamily = new Map<string, Entry[]>();
    for (const e of entries) if (e.family) byFamily.set(e.family, [...(byFamily.get(e.family) ?? []), e]);
    for (const list of byFamily.values()) {
      expect(list.length).toBeLessThanOrEqual(2);
      expect(new Set(list.map((e) => e.difficulty)).size).toBe(list.length);
    }
  });
});
