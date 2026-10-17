import { Link, useParams } from "react-router-dom";
import { computeBom } from "../plan/bom";
import { computeShop, computeTools } from "../plan/stock";
import { hasPaint, paintColors } from "../plan/who";
import { PartThumb } from "../scene/PartThumb";
import { finishedImage } from "../scene/snapshot";
import { ShopThumb, ToolThumb } from "../scene/StockThumb";
import { useImage } from "../scene/useImage";
import { SettingsButton, useSettings } from "./Settings";
import { Icon, LevelPill, minutesText, Notice, useTitle } from "./ui";
import { useCatalog, usePlan, type PlanSource } from "./usePlan";

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
  const { settings } = useSettings();
  const catalog = useCatalog();
  useTitle(plan?.title ?? "");
  const picture = useImage(
    () => (plan ? finishedImage(plan, settings.paint, 960, 640) : Promise.reject(new Error("wait"))),
    `${plan?.id}|${settings.paint}`,
  );
  const startTo = local ? "/local" : `/p/${id}`;
  const printTo = local ? "/local/print" : `/p/${id}/print`;

  if (status === "loading") return <Notice>Loading plan…</Notice>;
  if (status === "missing" || !plan) {
    return (
      <Notice>
        No plan loaded. <Link to="/">Back to projects</Link>
      </Notice>
    );
  }

  const shop = computeShop(plan);
  const cut = computeBom(plan);
  const tools = computeTools(plan);
  const size = plan.finished_size;
  const colors = paintColors(plan);
  const here = catalog.find((e) => e.id === id);
  const sibling = here?.family ? catalog.find((e) => e.family === here.family && e.id !== here.id) : undefined;

  return (
    <div className="page prep">
      <div className="topline">
        <Link className="btn btn-ghost" to="/">
          <Icon name="back" />
          <span className="btn-text">Projects</span>
        </Link>
        <span className="topline-gap" />
        <Link className="btn btn-ghost" to={printTo}>
          <Icon name="print" />
          <span className="btn-text">Print</span>
        </Link>
        <SettingsButton />
      </div>

      <header className="prep-hero">
        <div className="prep-pic">{picture ? <img src={picture} alt={`Finished ${plan.title}`} /> : <span className="shimmer" aria-hidden />}</div>
        <div className="prep-intro">
          <p className="eyebrow">Before you start</p>
          <h1>{plan.title}</h1>
          <p className="lede">{plan.summary}</p>
          <p className="meta">
            <LevelPill level={plan.difficulty} />
            <span>{minutesText(plan.time_minutes)}</span>
            <span>
              {size.x} × {size.y} × {size.z} mm
            </span>
          </p>
          <div className="prep-cta">
            <Link className="btn btn-primary btn-big" to={startTo}>
              Start building <Icon name="next" />
            </Link>
          </div>
          {sibling ? (
            <p className="hint">
              {sibling.difficulty === "hard" || (sibling.difficulty === "medium" && plan.difficulty === "easy")
                ? "Want a challenge? "
                : "Want it simpler? "}
              <Link to={`/p/${sibling.id}/prep`}>Try the {sibling.difficulty} version: {sibling.title}</Link>
            </p>
          ) : null}
        </div>
      </header>

      <section className="panel">
        <h2>Buy</h2>
        <p className="hint">
          Ask the store to cut the vineer rectangle. One 8 mm ümarliist is a whole 2.4 m stick — leftover is normal.
          Disks and rings are cut from the ply, not bought as parts.
        </p>
        <ul className="rows">
          {shop.map((line) => (
            <li key={line.id}>
              <div className="thumb">
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

      <section className="panel">
        <h2>Cut</h2>
        <p className="hint">These are the finished pieces you make from the stock above.</p>
        <ul className="rows">
          {cut.map((line) => {
            const sample = plan.parts.find((p) => p.id === line.sampleId);
            return (
              <li key={line.key}>
                <div className="thumb">{sample ? <PartThumb part={sample} /> : null}</div>
                <div>
                  <strong>
                    {line.qty}× {line.label}
                  </strong>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h2>Tools</h2>
        <ul className="rows">
          {tools.map((tool) => (
            <li key={tool.id}>
              <div className="thumb">
                <ToolThumb icon={tool.icon} />
              </div>
              <div>
                <strong>{tool.label}</strong>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {hasPaint(plan) ? (
        <section className="panel">
          <h2>Paint (optional)</h2>
          <p className="hint">
            Water-based craft paint, a brush and old newspaper. Kids can lead this part. Colours used in the picture:
          </p>
          <ul className="swatches">
            {colors.map((c) => (
              <li key={c}>
                <span className="swatch" style={{ background: c }} />
                <code>{c}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel">
        <h2>Safety</h2>
        <ul className="rows plain">
          {SAFETY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <div className="sticky-cta">
        <Link className="btn btn-primary btn-big" to={startTo}>
          Start building <Icon name="next" />
        </Link>
      </div>
    </div>
  );
}
