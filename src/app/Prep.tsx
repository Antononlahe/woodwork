import { Link, useParams } from "react-router-dom";
import { computeBom } from "../plan/bom";
import { computeShop, computeTools } from "../plan/stock";
import { PlanScene } from "../scene/PlanScene";
import { ShopThumb, ToolThumb } from "../scene/StockThumb";
import { usePlan, type PlanSource } from "./usePlan";

const SAFETY = [
  "An adult runs the saw and the drill.",
  "Clamp the work. Do not hold a small piece in your hand while cutting.",
  "Wear eye protection.",
  "No loose sleeves or dangling hair near the drill.",
  "Let glue dry before the next step that loads the joint.",
];

export function Prep({ local = false }: { local?: boolean }) {
  const { id } = useParams();
  const source: PlanSource = local ? { type: "local" } : { type: "catalog", id: id ?? "" };
  const { plan, status } = usePlan(source);
  const startTo = local ? "/local" : `/p/${id}`;
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

  const shop = computeShop(plan);
  const cut = computeBom(plan);
  const tools = computeTools(plan);
  const size = plan.finished_size;

  return (
    <div className="page prep">
      <div className="prep-actions">
        <Link className="text-link" to="/">
          ← Plans
        </Link>
        <Link className="btn btn-small" to={printTo}>
          Print
        </Link>
        <Link className="btn" to={startTo}>
          Start
        </Link>
      </div>

      <p className="eyebrow">Before you start</p>
      <h1>{plan.title}</h1>
      <p className="lede">{plan.summary}</p>
      <p className="meta">
        {plan.time_minutes} minutes · {size.x} × {size.y} × {size.z}mm · {plan.difficulty}
      </p>

      <div className="prep-preview">
        <PlanScene
          plan={plan}
          view="iso"
          stepIndex={plan.steps.length}
          showGrid={false}
          interactive={false}
          showDimensions={false}
        />
      </div>

      <section>
        <h2>Buy</h2>
        <p className="hint">
          Ask the store to cut the vineer rectangle. One 8 mm ümarliist is a whole 2.4 m stick — leftover is normal.
          Disks and rings are cut from the ply, not bought as parts.
        </p>
        <ul className="prep-list prep-cards">
          {shop.map((line) => (
            <li key={line.id}>
              <div className="prep-thumb">
                <ShopThumb line={line} />
              </div>
              <div>
                <strong>
                  {line.qty}× {line.label}
                </strong>
                <span>{line.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Cut</h2>
        <p className="hint">These are the finished pieces you make from the stock above.</p>
        <ul className="prep-list">
          {cut.map((line) => (
            <li key={line.key}>
              <strong>
                {line.qty}× {line.label}
              </strong>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Tools</h2>
        <ul className="prep-list prep-cards">
          {tools.map((tool) => (
            <li key={tool.id}>
              <div className="prep-thumb">
                <ToolThumb icon={tool.icon} />
              </div>
              <div>
                <strong>{tool.label}</strong>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Safety</h2>
        <ul className="prep-list">
          {SAFETY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
