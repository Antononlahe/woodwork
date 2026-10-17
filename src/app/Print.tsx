import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { computeBom } from "../plan/bom";
import { computeShop } from "../plan/stock";
import { needsAdult, paintColors } from "../plan/who";
import { stepImages } from "../scene/snapshot";
import { NoPlan, Notice, useTitle } from "./ui";
import { useSettings } from "./Settings";
import { usePlan, type PlanSource } from "./usePlan";

export function PrintView({ local = false }: { local?: boolean }) {
  const { id } = useParams();
  const source: PlanSource = local ? { type: "local" } : { type: "catalog", id: id ?? "" };
  const { plan, status, diagnostics } = usePlan(source);
  const { settings } = useSettings();
  const [images, setImages] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const back = local ? "/local" : `/p/${id}`;
  useTitle(plan ? `${plan.title} (print)` : "");

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    setImages([]);
    setFailed(false);
    void stepImages(plan, settings.paint)
      .then((urls) => {
        if (!cancelled) setImages(urls);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [plan, settings.paint]);

  if (status === "loading") return <Notice>Preparing print…</Notice>;
  if (status === "missing" || !plan) {
    return <NoPlan diagnostics={diagnostics} />;
  }

  const shop = computeShop(plan);
  const bom = computeBom(plan);
  const colors = paintColors(plan);
  const finished = images[images.length - 1];
  const size = plan.finished_size;

  return (
    <div className="print-root">
      <div className="print-toolbar no-print">
        <Link className="btn btn-ghost" to={back}>
          ← Bench
        </Link>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <article className="page-sheet cover">
        <p className="eyebrow">Woodwork plan</p>
        <h1>{plan.title}</h1>
        <p className="lede">{plan.summary}</p>
        <p className="meta">
          <span>{plan.time_minutes} minutes</span>
          <span>
            {size.x} × {size.y} × {size.z} mm
          </span>
          <span>{plan.difficulty}</span>
        </p>
        {finished ? <img src={finished} alt="Finished model" /> : <p>{failed ? "Could not draw the pictures here. The text pages still print." : "Drawing the finished model…"}</p>}
      </article>

      <article className="page-sheet">
        <h2>Buy</h2>
        <p>Ask the store to cut the vineer rectangle. Ümarliist is sold as a whole 2.4 m stick.</p>
        <table>
          <thead>
            <tr>
              <th>Qty</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {shop.map((line) => (
              <tr key={line.id}>
                <td>{line.qty}</td>
                <td>
                  {line.label}
                  <br />
                  <small>{line.detail}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {colors.length > 0 ? (
          <p>
            Optional paint:{" "}
            {colors.map((c) => (
              <span key={c} className="print-swatch">
                <i style={{ background: c }} /> {c}
              </span>
            ))}
          </p>
        ) : null}
      </article>

      <article className="page-sheet">
        <h2>Cut</h2>
        <table>
          <thead>
            <tr>
              <th>Qty</th>
              <th>Part</th>
            </tr>
          </thead>
          <tbody>
            {bom.map((line) => (
              <tr key={line.key}>
                <td>{line.qty}</td>
                <td>{line.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {plan.steps.map((step, i) => (
        <article key={step.id} className="page-sheet">
          <p className="eyebrow">
            Step {i + 1} of {plan.steps.length} · {step.paint ? "optional paint" : needsAdult(step) ? "grown-up job" : "kid job"}
          </p>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
          {images[i] ? <img src={images[i]} alt={step.title} /> : <p>{failed ? "" : "Drawing this step…"}</p>}
        </article>
      ))}
    </div>
  );
}
