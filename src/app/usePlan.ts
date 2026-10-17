import { useEffect, useState } from "react";
import { parsePlanYaml } from "../plan/parse";
import type { Diagnostic, Plan } from "../plan/types";
import { validatePlan } from "../plan/validate";

export const LOCAL_PLAN_KEY = "woodwork.localPlan";

export type CatalogEntry = {
  id: string;
  title: string;
  file: string;
  summary: string;
};

export type PlanSource = { type: "catalog"; id: string } | { type: "local" };

export type PlanState = {
  plan?: Plan;
  diagnostics: Diagnostic[];
  status: "loading" | "ready" | "missing";
};

export function loadPlanText(text: string): { plan?: Plan; diagnostics: Diagnostic[] } {
  const parsed = parsePlanYaml(text);
  if (!parsed.plan) return parsed;
  return { plan: parsed.plan, diagnostics: [...parsed.diagnostics, ...validatePlan(parsed.plan)] };
}

export function useCatalog(): CatalogEntry[] {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  useEffect(() => {
    void fetch("/plans/catalog.json")
      .then((r) => r.json())
      .then((data: CatalogEntry[]) => setEntries(data));
  }, []);
  return entries;
}

export function useCatalogPlan(file: string | undefined): Plan | undefined {
  const [plan, setPlan] = useState<Plan | undefined>();
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    void fetch(`/plans/${file}`)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        setPlan(loadPlanText(text).plan);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);
  return plan;
}

export function usePlan(source: PlanSource): PlanState {
  const catalog = useCatalog();
  const [state, setState] = useState<PlanState>({ diagnostics: [], status: "loading" });

  useEffect(() => {
    if (source.type === "local") {
      const text = sessionStorage.getItem(LOCAL_PLAN_KEY);
      if (!text) {
        setState({ diagnostics: [], status: "missing" });
        return;
      }
      const loaded = loadPlanText(text);
      setState({ ...loaded, status: "ready" });
      return;
    }

    const entry = catalog.find((e) => e.id === source.id);
    if (catalog.length === 0) {
      setState({ diagnostics: [], status: "loading" });
      return;
    }
    if (!entry) {
      setState({ diagnostics: [], status: "missing" });
      return;
    }
    let cancelled = false;
    void fetch(`/plans/${entry.file}`)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        const loaded = loadPlanText(text);
        setState({ ...loaded, status: "ready" });
      });
    return () => {
      cancelled = true;
    };
  }, [source.type, source.type === "catalog" ? source.id : "local", catalog]);

  return state;
}
