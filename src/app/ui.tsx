import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { Diagnostic, Plan } from "../plan/types";

const PATHS = {
  back: "M15 5l-7 7 7 7",
  close: "M6 6l12 12M18 6L6 18",
  gear: "M4 7h10M18 7h2M4 17h2M10 17h10M14 7a2 2 0 104 0 2 2 0 10-4 0M6 17a2 2 0 104 0 2 2 0 10-4 0",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  print: "M7 9V3h10v6M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v7H7z",
  cube: "M12 3l8 4.500v9L12 21l-8-4.500v-9L12 3zm0 9l8-4.500M12 12v9M12 12L4 7.500",
  next: "M9 5l7 7-7 7",
  check: "M5 13l4 4L19 7",
  hand: "M8 12V5a1.500 1.500 0 013 0v6m0-5.500a1.500 1.500 0 013 0V12m0-5a1.500 1.500 0 013 0v7a6 6 0 01-6 6h-1a6 6 0 01-5-2.700L3.500 14a1.500 1.500 0 012.300-1.900L8 14.500",
  tool: "M14.700 6.300a4 4 0 005 5l-9 9a2.100 2.100 0 01-3-3l9-9a4 4 0 01-2-2zM17 3l-2.500 2.500L18.500 9.500 21 7a4 4 0 00-4-4z",
  brush: "M18 3l3 3-9 9-3-3 9-9zM9 14c-2.500 0-4 1.500-4 4 0 1.500-1 2-2 3 3 1 8 0 8-4",
  home: "M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Bench plans` : "Bench plans";
  }, [title]);
}

const LEVEL: Record<Plan["difficulty"], string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

export function LevelPill({ level }: { level: Plan["difficulty"] }) {
  return <span className={`pill pill-${level}`}>{LEVEL[level]}</span>;
}

export function minutesText(min: number): string {
  if (min < 90) return `${min} min`;
  const h = Math.round((min / 60) * 2) / 2;
  return `${h} h`;
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="page notice">
      <p>{children}</p>
    </div>
  );
}

/** Shown when there is no usable plan. Says why when the file was read but broken. */
export function NoPlan({ diagnostics = [] }: { diagnostics?: Diagnostic[] }) {
  return (
    <div className="page notice">
      <p>{diagnostics.length > 0 ? "This plan file has problems:" : "No plan loaded."}</p>
      {diagnostics.length > 0 && (
        <ul className="problems">
          {diagnostics.slice(0, 8).map((d) => (
            <li key={`${d.path}-${d.code}`}>
              <code>{d.path}</code> {d.message}
            </li>
          ))}
        </ul>
      )}
      <Link className="btn" to="/">
        Back to projects
      </Link>
    </div>
  );
}
