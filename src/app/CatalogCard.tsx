import { Link } from "react-router-dom";
import { PlanScene } from "../scene/PlanScene";
import { useCatalogPlan, type CatalogEntry } from "./usePlan";

export function CatalogCard({ entry }: { entry: CatalogEntry }) {
  const plan = useCatalogPlan(entry.file);
  const finishedStep = plan ? plan.steps.length : 0;

  return (
    <Link className="ticket" to={`/p/${entry.id}/prep`}>
      <div className="ticket-preview">
        {plan ? (
          <PlanScene
            plan={plan}
            view="iso"
            stepIndex={finishedStep}
            showGrid={false}
            interactive={false}
            showDimensions={false}
          />
        ) : (
          <p className="ticket-preview-wait">Drawing the finished build…</p>
        )}
      </div>
      <div className="ticket-body">
        <span className="ticket-stamp">Ready</span>
        <h2>{entry.title}</h2>
        <p>{entry.summary}</p>
        <span className="ticket-go">Open on the bench →</span>
      </div>
    </Link>
  );
}
