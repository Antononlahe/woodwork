import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { computeBom } from "../plan/bom";
import { hasBlockingErrors } from "../plan/types";
import { PartThumb } from "../scene/PartThumb";
import { PlanScene, type ViewMode } from "../scene/PlanScene";
import { usePlan, type PlanSource } from "./usePlan";

export function Bench({ local = false }: { local?: boolean }) {
  const { id } = useParams();
  const source: PlanSource = local ? { type: "local" } : { type: "catalog", id: id ?? "" };
  const { plan, diagnostics, status } = usePlan(source);
  const [view, setView] = useState<ViewMode>("orbit");
  const [step, setStep] = useState(0);
  const [showBom, setShowBom] = useState(false);
  const [showFinished, setShowFinished] = useState(true);
  const [zoomFinished, setZoomFinished] = useState(false);

  const last = plan ? Math.max(plan.steps.length - 1, 0) : 0;
  const finishedIndex = plan ? plan.steps.length : 0;
  const stepIndex = Math.min(step, last);
  const current = plan && stepIndex < plan.steps.length ? plan.steps[stepIndex] : undefined;
  const bom = useMemo(() => (plan ? computeBom(plan) : []), [plan]);
  const printTo = local ? "/local/print" : `/p/${id}/print`;
  const backTo = local ? "/local/prep" : `/p/${id}/prep`;

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
        <Link className="text-link" to={backTo}>
          ← Need
        </Link>
        <h1>{plan.title}</h1>
        <div className="bench-actions">
          <button type="button" className={`btn btn-small ${showBom ? "btn-on" : ""}`} onClick={() => setShowBom((v) => !v)}>
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
        {blocked ? (
          <div className="stage-empty">Fix the plan errors to see the 3D view.</div>
        ) : (
          <PlanScene plan={plan} view={view} stepIndex={stepIndex} />
        )}
        {!blocked && (
          <aside className={`finished-dock ${showFinished ? "finished-dock-open" : ""}`}>
            <button type="button" className="finished-toggle" onClick={() => setShowFinished((v) => !v)}>
              {showFinished ? "Hide finished" : "Show finished"}
            </button>
            {showFinished && (
              <button
                type="button"
                className="finished-inset"
                title="Zoom the finished model"
                onClick={() => setZoomFinished(true)}
              >
                <PlanScene
                  plan={plan}
                  view="iso"
                  stepIndex={finishedIndex}
                  showGrid={false}
                  interactive={false}
                  showDimensions={false}
                />
              </button>
            )}
          </aside>
        )}
        {zoomFinished && !blocked && (
          <div className="finished-zoom">
            <div className="finished-zoom-bar">
              <p>Finished {plan.title}</p>
              <button type="button" className="btn btn-small" onClick={() => setZoomFinished(false)}>
                Close
              </button>
            </div>
            <div className="finished-zoom-stage">
              <PlanScene
                plan={plan}
                view="iso"
                stepIndex={finishedIndex}
                showGrid={false}
                interactive
                showDimensions={false}
              />
            </div>
          </div>
        )}
        {showBom && (
          <aside className="bom-panel">
            <h2>Materials</h2>
            <ul>
              {bom.map((line) => {
                const sample = plan.parts.find((p) => p.id === line.sampleId);
                return (
                  <li key={line.key}>
                    <div className="bom-thumb">{sample ? <PartThumb part={sample} /> : null}</div>
                    <div>
                      <span className="qty">{line.qty}×</span> {line.label}
                    </div>
                  </li>
                );
              })}
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
          <h2>{current ? current.title : plan.title}</h2>
          <p>{current ? current.body : plan.summary}</p>
          {stepIndex < last ? <p className="step-key">Orange is this piece. Blue wire is the next fit.</p> : null}
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
