import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Plan } from "../plan/types";
import { CatalogCard } from "./CatalogCard";
import { SettingsButton } from "./Settings";
import { useTitle } from "./ui";
import { LOCAL_PLAN_KEY, useCatalog } from "./usePlan";

type Filter = "all" | Plan["difficulty"];

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["easy", "Easy"],
  ["medium", "Medium"],
  ["hard", "Hard"],
];

export function Home() {
  useTitle("");
  const catalog = useCatalog();
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [bad, setBad] = useState(false);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        sessionStorage.setItem(LOCAL_PLAN_KEY, String(reader.result));
        void navigate("/local/prep");
      } catch {
        setBad(true);
      }
    };
    reader.onerror = () => setBad(true);
    reader.readAsText(file);
  }

  const shown = catalog.filter((e) => filter === "all" || e.difficulty === filter);

  return (
    <div className="page home">
      <div className="topline">
        <span className="brand">Bench plans</span>
        <SettingsButton />
      </div>

      <header className="mast">
        <p className="eyebrow">A grown-up and a kid</p>
        <h1>Build something together</h1>
        <p className="lede">
          Pick a project. Step by step 3D shows what to cut, drill and glue. Grown-ups run the saw and drill; kids sand,
          glue and paint.
        </p>
      </header>

      <div className="chips" role="group" aria-label="Show projects by level">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`chip ${filter === value ? "on" : ""}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="catalog" aria-live="polite">
        {catalog.length === 0
          ? [0, 1, 2].map((i) => <div key={i} className="card card-skeleton" aria-hidden />)
          : shown.map((entry) => <CatalogCard key={entry.id} entry={entry} />)}
        {catalog.length > 0 && shown.length === 0 ? <p className="hint">Nothing at this level yet.</p> : null}
      </section>

      <section className="open-file">
        <div>
          <h2>Have your own plan?</h2>
          <p>Open a <code>.ww.yaml</code> file from this device. Nothing is uploaded.</p>
          {bad ? <p className="error-text">Could not read that file.</p> : null}
        </div>
        <button type="button" className="btn" onClick={() => input.current?.click()}>
          Open plan file
        </button>
        <input
          ref={input}
          type="file"
          accept=".yaml,.ww.yaml,.yml"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </section>
    </div>
  );
}
