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
  difficulty: Plan["difficulty"];
  time_minutes: number;
  /** Same project at another level: entries with one `family` are easy/hard versions of each other. */
  family?: string;
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

// Plans are static files: fetch each once per page load.
let catalogLoad: Promise<CatalogEntry[]> | undefined;
const planLoads = new Map<string, Promise<PlanState>>();

function fetchCatalog(): Promise<CatalogEntry[]> {
  catalogLoad ??= fetch("/plans/catalog.json")
    .then((r) => (r.ok ? (r.json() as Promise<CatalogEntry[]>) : Promise.reject(new Error(String(r.status)))))
    .catch(() => {
      catalogLoad = undefined; // a network blip should not stick until reload
      return [];
    });
  return catalogLoad;
}

function fetchPlan(file: string): Promise<PlanState> {
  let hit = planLoads.get(file);
  if (!hit) {
    hit = fetch(`/plans/${file}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text): PlanState => ({ ...loadPlanText(text), status: "ready" }))
      .catch((): PlanState => {
        planLoads.delete(file);
        return { diagnostics: [], status: "missing" };
      });
    planLoads.set(file, hit);
  }
  return hit;
}

export function useCatalog(): CatalogEntry[] {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  useEffect(() => {
    let live = true;
    void fetchCatalog().then((data) => live && setEntries(data));
    return () => {
      live = false;
    };
  }, []);
  return entries;
}

export function useCatalogPlan(file: string | undefined): Plan | undefined {
  const [plan, setPlan] = useState<Plan | undefined>();
  useEffect(() => {
    if (!file) return;
    let live = true;
    void fetchPlan(file).then((s) => live && setPlan(s.plan));
    return () => {
      live = false;
    };
  }, [file]);
  return plan;
}

export function usePlan(source: PlanSource): PlanState {
  const [state, setState] = useState<PlanState>({ diagnostics: [], status: "loading" });
  const catalogId = source.type === "catalog" ? source.id : "";
  const local = source.type === "local";

  useEffect(() => {
    let live = true;
    if (local) {
      let text: string | null = null;
      try {
        text = sessionStorage.getItem(LOCAL_PLAN_KEY);
      } catch {
        // storage blocked: treat as no plan
      }
      setState(text ? { ...loadPlanText(text), status: "ready" } : { diagnostics: [], status: "missing" });
      return;
    }
    setState({ diagnostics: [], status: "loading" });
    void fetchCatalog().then((catalog) => {
      const entry = catalog.find((e) => e.id === catalogId);
      if (!entry) {
        if (live) setState({ diagnostics: [], status: "missing" });
        return;
      }
      void fetchPlan(entry.file).then((s) => live && setState(s));
    });
    return () => {
      live = false;
    };
  }, [local, catalogId]);

  return state;
}
