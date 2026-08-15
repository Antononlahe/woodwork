import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { computeBom } from "../plan/bom";
import { bakeStepImages } from "../scene/bake";
import { usePlan, type PlanSource } from "./usePlan";

export function PrintView({ local = false }: { local?: boolean }) {
  const { id } = useParams();
  const source: PlanSource = local ? { type: "local" } : { type: "catalog", id: id ?? "" };
  const { plan, status } = usePlan(source);
  const [images, setImages] = useState<string[]>([]);
  const back = local ? "/local" : `/p/${id}`;

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    void bakeStepImages(plan).then((urls) => {
      if (!cancelled) setImages(urls);
    });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  if (status === "loading" || !plan) return <div className="page">Preparing print…</div>;

  const bom = computeBom(plan);
  const finished = images[images.length - 1];
  const size = plan.finished_size;

  return (
    <div className="print-root">
      <div className="print-toolbar no-print">
        <Link to={back}>← Bench</Link>
        <button type="button" className="btn" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <article className="page-sheet cover">
        <p className="eyebrow">Woodwork plan</p>
        <h1>{plan.title}</h1>
        <p className="lede">{plan.summary}</p>
        <p className="meta">
          {plan.time_minutes} minutes · {size.x} × {size.y} × {size.z}mm · {plan.difficulty}
        </p>
        {finished ? <img src={finished} alt="Finished model" /> : <p>Drawing the finished model…</p>}
      </article>

      <article className="page-sheet">
        <h2>Materials</h2>
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
            Step {i + 1} of {plan.steps.length}
          </p>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
          {images[i] ? <img src={images[i]} alt={step.title} /> : <p>Drawing this step…</p>}
        </article>
      ))}
    </div>
  );
}
