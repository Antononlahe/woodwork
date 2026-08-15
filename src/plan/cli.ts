import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { parsePlanYaml } from "./parse";
import { validatePlan } from "./validate";

function collectYaml(target: string): string[] {
  const st = statSync(target);
  if (st.isDirectory()) {
    return readdirSync(target)
      .filter((name) => name.endsWith(".ww.yaml"))
      .map((name) => join(target, name));
  }
  return [target];
}

function main(argv: string[]): number {
  const inputs = argv.length > 0 ? argv : ["public/plans"];
  let errors = 0;
  for (const input of inputs) {
    const files = collectYaml(resolve(input));
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const parsed = parsePlanYaml(text);
      const extra = parsed.plan ? validatePlan(parsed.plan) : [];
      const diags = [...parsed.diagnostics, ...extra];
      if (diags.length === 0) {
        console.log(`ok  ${file}`);
        continue;
      }
      for (const d of diags) {
        const line = `${d.level} ${d.code} ${d.path}: ${d.message}`;
        console.log(`${file}: ${line}`);
        if (d.level === "error") errors += 1;
      }
    }
  }
  return errors > 0 ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));
