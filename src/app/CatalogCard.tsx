import { Link } from "react-router-dom";
import { finishedImage } from "../scene/snapshot";
import { useImage } from "../scene/useImage";
import { useCatalogPlan, type CatalogEntry } from "./usePlan";
import { useSettings } from "./Settings";
import { LevelPill, minutesText } from "./ui";

export function CatalogCard({ entry }: { entry: CatalogEntry }) {
  const plan = useCatalogPlan(entry.file);
  const { settings } = useSettings();
  const picture = useImage(
    () => (plan ? finishedImage(plan, settings.paint) : Promise.reject(new Error("wait"))),
    `${entry.id}|${!!plan}|${settings.paint}`,
  );

  return (
    <Link className="card" to={`/p/${entry.id}/prep`}>
      <div className="card-pic">
        {picture ? <img src={picture} alt="" /> : <span className="shimmer" aria-hidden />}
      </div>
      <div className="card-body">
        <div className="card-meta">
          <LevelPill level={entry.difficulty} />
          <span>{minutesText(entry.time_minutes)}</span>
        </div>
        <h2>{entry.title}</h2>
        <p>{entry.summary}</p>
        <span className="card-go">Open project →</span>
      </div>
    </Link>
  );
}
