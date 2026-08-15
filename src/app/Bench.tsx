import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { computeBom } from "../plan/bom";
import { hasBlockingErrors } from "../plan/types";
import { PlanScene, type ViewMode } from "../scene/PlanScene";
import { usePlan, type PlanSource } from "./usePlan";

export function Bench({ local = false }: { local?: boolean }) {
  const { id } = useParams();
  const source: PlanSource = local ? { type: "local" } : { type: "catalog", id: id ?? "" };
  const { plan, diagnostics, status } = usePlan(source);
  const [view, setView] = useState<ViewMode>("orbit");
  const [step, setStep] = useState(0);
  const [showBom, setShowBom] = useState(false);

  const last = plan ? plan.steps.length : 0;
  const stepIndex = Math.min(step, last);
  const current = plan && stepIndex < plan.steps.length ? plan.steps[stepIndex] : undefined;
  const bom = useMemo(() => (plan ? computeBom(plan) : []), [plan]);
  const printTo = local ? "/local/print" : `/p/${id}/print`;

  if (status === "loading") return <div className="page">Loading plan…</div>;
  if (status === "missing" || !plan) {
    return (
      <div className="page">
        <p>No plan loaded.</p>
        <Link to="/">Back</Link>
      </div>
    );
  }

  const blocked = hasBlockingErrors(diagnostics);

  return (
    <div className="bench">
      <header className="bench-bar">
        <Link className="text-link" to="/">
          ← Plans
        </Link>
        <h1>{plan.title}</h1>
        <div className="bench-actions">
          <button type="button" className="btn btn-small" onClick={() => setShowBom((v) => !v)}>
            Materials
          </button>
          <button
            type="button"
            className="btn btn-small"
            onClick={() => setView((v) => (v === "orbit" ? "iso" : "orbit"))}
          >
            {view === "orbit" ? "Isometric" : "3D orbit"}
          </button>
          <Link className="btn btn-small" to={printTo}>
            Print
          </Link>
        </div>
      </header>

      {diagnostics.length > 0 && (
        <div className={`banner ${blocked ? "banner-error" : "banner-warn"}`}>
          {diagnostics.map((d) => (
            <p key={`${d.path}-${d.code}`}>
              <strong>{d.level}</strong> {d.code}: {d.message}
            </p>
          ))}
        </div>
      )}

      <div className="bench-stage">
        {blocked ? <div className="stage-empty">Fix the plan errors to see the 3D view.</div> : <PlanScene plan={plan} view={view} stepIndex={stepIndex} />}
        {showBom && (
          <aside className="bom-panel">
            <h2>Materials</h2>
            <ul>
              {bom.map((line) => (
                <li key={line.key}>
                  <span className="qty">{line.qty}×</span> {line.label}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <footer className="step-ticket">
        <div className="step-num">
          <span>Step</span>
          <strong>
            {stepIndex + 1} / {last + 1}
          </strong>
        </div>
        <div className="step-copy">
          <h2>{current ? current.title : "Finished"}</h2>
          <p>{current ? current.body : "This is the assembled windmill. Compare it to your bench."}</p>
        </div>
        <div className="step-nav">
          <button type="button" className="btn" disabled={stepIndex === 0} onClick={() => setStep((s) => s - 1)}>
            Prev
          </button>
          <button type="button" className="btn" disabled={stepIndex === last} onClick={() => setStep((s) => s + 1)}>
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
