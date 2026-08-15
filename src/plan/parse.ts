import { parse } from "yaml";
import { planSchema } from "./schema";
import type { Diagnostic, Plan } from "./types";

export function parsePlanYaml(text: string): { plan?: Plan; diagnostics: Diagnostic[] } {
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (err) {
    return {
      diagnostics: [
        {
          level: "error",
          path: "",
          code: "schema",
          message: err instanceof Error ? err.message : "invalid yaml",
        },
      ],
    };
  }

  const result = planSchema.safeParse(raw);
  if (!result.success) {
    return {
      diagnostics: result.error.issues.map((issue) => ({
        level: "error" as const,
        path: issue.path.map(String).join("."),
        code: "schema",
        message: issue.message,
      })),
    };
  }

  return { plan: result.data, diagnostics: [] };
}
