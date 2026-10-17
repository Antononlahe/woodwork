import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { computeBom, partKey, partLabel } from "../plan/bom";
import { hasBlockingErrors, type Plan, type Step } from "../plan/types";
import { hasPaint, needsAdult } from "../plan/who";
import { PartThumb } from "../scene/PartThumb";
import { PlanScene, type ViewMode } from "../scene/PlanScene";
import { finishedImage } from "../scene/snapshot";
import { firstSeenIds } from "../scene/stepView";
import { useImage } from "../scene/useImage";
import { SettingsButton, useSettings } from "./Settings";
import { Icon, LevelPill, Notice, useTitle } from "./ui";
import { usePlan, type PlanSource } from "./usePlan";

const STEP_KEY = "woodwork.step.";
const PANEL_KEY = "woodwork.panel.";
const panelDefault = {
  wide: () => Math.round(Math.min(400, window.innerWidth * 0.42)),
  tall: () => Math.round(Math.min(Math.max(window.innerHeight * 0.34, 240), 380)),
};
const WIDE = "(min-width: 640px) and (min-aspect-ratio: 1/1)";

function read(key: string): number | undefined {
  try {
    const n = Number(localStorage.getItem(key));
    return Number.isFinite(n) && localStorage.getItem(key) !== null ? n : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, n: number) {
  try {
    localStorage.setItem(key, String(n));
  } catch {
    // not saved; still works this session
  }
}

function useMedia(query: string): boolean {
  const [on, setOn] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setOn(mq.matches);
    mq.addEventListener("change", fn);
    fn();
    return () => mq.removeEventListener("change", fn);
  }, [query]);
  return on;
}

/** Drag (or arrow keys) to size the step panel. Width beside the model, height under it. */
function Splitter({
  wide,
  size,
  onSize,
  box,
}: {
  wide: boolean;
  size: number;
  onSize: (n: number) => void;
  box: React.RefObject<HTMLElement | null>;
}) {
  const limit = () => {
    const r = box.current?.getBoundingClientRect();
    const total = r ? (wide ? r.width : r.height) : 800;
    return { min: wide ? 280 : 150, max: Math.max(total * (wide ? 0.6 : 0.75), 320) };
  };
  const clamp = (n: number) => {
    const { min, max } = limit();
    return Math.round(Math.min(Math.max(n, min), max));
  };
  function drag(e: PointerEvent<HTMLDivElement>) {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    const r = box.current?.getBoundingClientRect();
    if (!r || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onSize(clamp(wide ? r.right - e.clientX : r.bottom - e.clientY));
  }
  function key(e: KeyboardEvent<HTMLDivElement>) {
    const grow = wide ? "ArrowLeft" : "ArrowUp";
    const shrink = wide ? "ArrowRight" : "ArrowDown";
    if (e.key === grow) onSize(clamp(size + 24));
    else if (e.key === shrink) onSize(clamp(size - 24));
    else return;
    e.preventDefault();
  }
  const { min, max } = limit();
  return (
    <div
      className="splitter"
      role="separator"
      aria-orientation={wide ? "vertical" : "horizontal"}
      aria-label="Resize the steps panel"
      aria-valuenow={size}
      aria-valuemin={min}
      aria-valuemax={Math.round(max)}
      tabIndex={0}
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      onPointerMove={drag}
      onKeyDown={key}
      onDoubleClick={() => onSize(wide ? panelDefault.wide() : panelDefault.tall())}
    >
      <span />
    </div>
  );
}

function WhoBadge({ step }: { step: Step }) {
  if (step.paint) {
    return (
      <span className="who who-paint">
        <Icon name="brush" /> Optional · paint
      </span>
    );
  }
  return needsAdult(step) ? (
    <span className="who who-adult">
      <Icon name="tool" /> Grown-up job
    </span>
  ) : (
    <span className="who who-kid">
      <Icon name="hand" /> Kid job
    </span>
  );
}

function StepParts({ plan, stepIndex }: { plan: Plan; stepIndex: number }) {
  const groups = useMemo(() => {
    const map = new Map<string, { part: Plan["parts"][number]; qty: number }>();
    for (const id of firstSeenIds(plan, stepIndex)) {
      const part = plan.parts.find((p) => p.id === id);
      if (!part) continue;
      const key = partKey(part);
      const hit = map.get(key);
      if (hit) hit.qty += 1;
      else map.set(key, { part, qty: 1 });
    }
    return [...map.values()];
  }, [plan, stepIndex]);
  if (groups.length === 0) return null;
  return (
    <div className="step-parts">
      <h3>Pieces in this step</h3>
      <ul>
        {groups.map(({ part, qty }) => (
          <li key={part.id}>
            <div className="thumb thumb-sm">
              <PartThumb part={part} />
            </div>
            <span>
              <strong>{qty}×</strong> {partLabel(part)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bench({ local = false }: { local?: boolean }) {
  const { id } = useParams();
  const source: PlanSource = local ? { type: "local" } : { type: "catalog", id: id ?? "" };
  const { plan, diagnostics, status } = usePlan(source);
  const { settings } = useSettings();
  const wide = useMedia(WIDE);
  const [view, setView] = useState<ViewMode>("orbit");
  const [picked, setPicked] = useState<number>();
  const [showBom, setShowBom] = useState(false);
  const [showFinished, setShowFinished] = useState(() => window.innerWidth >= 700);
  const [zoomFinished, setZoomFinished] = useState(false);
  const [hint, setHint] = useState(true);
  const [sizes, setSizes] = useState<{ wide?: number; tall?: number }>({});
  const main = useRef<HTMLElement>(null);
  useTitle(plan?.title ?? "");

  const planId = plan?.id;
  const saved = useMemo(() => (planId ? (read(STEP_KEY + planId) ?? 0) : 0), [planId]);
  const total = plan ? plan.steps.length : 0;
  const last = Math.max(total - 1, 0);
  const stepIndex = Math.min(Math.max(picked ?? saved, 0), last);
  const go = useCallback(
    (n: number) => {
      const v = Math.min(Math.max(n, 0), last);
      setPicked(v);
      if (planId) write(STEP_KEY + planId, v);
    },
    [last, planId],
  );

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (t?.getAttribute("role") === "separator") return;
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "ArrowRight") go(stepIndex + 1);
      else if (e.key === "ArrowLeft") go(stepIndex - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, stepIndex]);

  const painted = settings.paint;
  const finishedPic = useImage(
    () => (plan ? finishedImage(plan, painted, 480, 320) : Promise.reject(new Error("wait"))),
    `${planId}|${painted}`,
  );
  const bom = useMemo(() => (plan ? computeBom(plan) : []), [plan]);

  if (status === "loading") return <Notice>Loading plan…</Notice>;
  if (status === "missing" || !plan) {
    return (
      <Notice>
        No plan loaded. <Link to="/">Back to projects</Link>
      </Notice>
    );
  }

  const current = plan.steps[stepIndex];
  const blocked = hasBlockingErrors(diagnostics);
  const printTo = local ? "/local/print" : `/p/${id}/print`;
  const backTo = local ? "/local/prep" : `/p/${id}/prep`;
  const panel = wide ? (sizes.wide ?? read(PANEL_KEY + "wide") ?? panelDefault.wide()) : (sizes.tall ?? read(PANEL_KEY + "tall") ?? panelDefault.tall());
  const setPanel = (n: number) => {
    setSizes((s) => (wide ? { ...s, wide: n } : { ...s, tall: n }));
    write(PANEL_KEY + (wide ? "wide" : "tall"), n);
  };
  const stepPaint = painted && !!current?.paint;
  const done = stepIndex === last;

  return (
    <div className="bench">
      <header className="bench-bar">
        <Link className="btn btn-ghost btn-icon" to={backTo} aria-label="Back to the shopping list">
          <Icon name="back" />
        </Link>
        <div className="bench-title">
          <h1>{plan.title}</h1>
          <LevelPill level={plan.difficulty} />
        </div>
        <div className="bench-actions">
          <button
            type="button"
            className={`btn btn-ghost btn-icon ${showBom ? "on" : ""}`}
            aria-pressed={showBom}
            aria-label="Pieces list"
            onClick={() => setShowBom((v) => !v)}
          >
            <Icon name="list" />
            <span className="btn-text">Pieces</span>
          </button>
          <Link className="btn btn-ghost btn-icon" to={printTo} aria-label="Print">
            <Icon name="print" />
            <span className="btn-text">Print</span>
          </Link>
          <SettingsButton />
        </div>
      </header>

      {diagnostics.length > 0 && (
        <div className={`banner ${blocked ? "banner-error" : "banner-warn"}`} role="alert">
          {diagnostics.map((d) => (
            <p key={`${d.path}-${d.code}`}>
              <strong>{d.level}</strong> {d.code}: {d.message}
            </p>
          ))}
        </div>
      )}

      <main
        ref={main}
        className={`bench-main ${wide ? "is-wide" : "is-tall"}`}
        style={{ ["--panel" as string]: `${panel}px` }}
      >
        <section className="bench-stage" aria-label="3D model" onPointerDown={() => setHint(false)}>
          {blocked ? (
            <div className="stage-empty">Fix the plan errors to see the 3D view.</div>
          ) : (
            <PlanScene
              plan={plan}
              view={view}
              stepIndex={stepIndex}
              painted={stepPaint}
              showGrid={settings.grid}
              showDimensions={settings.dims}
            />
          )}

          {!blocked && (
            <>
              <div className="view-seg seg" role="radiogroup" aria-label="View">
                <button type="button" role="radio" aria-checked={view === "orbit"} className={view === "orbit" ? "on" : ""} onClick={() => setView("orbit")}>
                  <Icon name="cube" /> Turn
                </button>
                <button type="button" role="radio" aria-checked={view === "iso"} className={view === "iso" ? "on" : ""} onClick={() => setView("iso")}>
                  Fixed
                </button>
              </div>

              {hint && view === "orbit" && <p className="stage-hint">Drag to turn · pinch or scroll to zoom</p>}

              <aside className="finished-dock">
                {showFinished && (
                  <button type="button" className="finished-inset" aria-label="Zoom the finished model" onClick={() => setZoomFinished(true)}>
                    {finishedPic ? <img src={finishedPic} alt="" /> : <span className="shimmer" aria-hidden />}
                    <span className="finished-tag">Finished{painted && hasPaint(plan) ? " · painted" : ""}</span>
                  </button>
                )}
                <button type="button" className="chip chip-small" aria-pressed={showFinished} onClick={() => setShowFinished((v) => !v)}>
                  {showFinished ? "Hide picture" : "Show finished"}
                </button>
              </aside>
            </>
          )}

          {zoomFinished && !blocked && (
            <div className="overlay finished-zoom">
              <div className="overlay-bar">
                <p>Finished {plan.title}</p>
                <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={() => setZoomFinished(false)}>
                  <Icon name="close" />
                </button>
              </div>
              <div className="finished-zoom-stage">
                <PlanScene
                  plan={plan}
                  view="orbit"
                  stepIndex={total}
                  painted={painted}
                  showGrid={false}
                  showDimensions={false}
                />
              </div>
            </div>
          )}

          {showBom && (
            <aside className="overlay bom-panel" aria-label="Pieces list">
              <div className="overlay-bar">
                <h2>All the pieces</h2>
                <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={() => setShowBom(false)}>
                  <Icon name="close" />
                </button>
              </div>
              <ul>
                {bom.map((line) => {
                  const sample = plan.parts.find((p) => p.id === line.sampleId);
                  return (
                    <li key={line.key}>
                      <div className="thumb thumb-sm">{sample ? <PartThumb part={sample} /> : null}</div>
                      <span>
                        <strong>{line.qty}×</strong> {line.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </aside>
          )}
        </section>

        <Splitter wide={wide} size={panel} onSize={setPanel} box={main} />

        <aside className="step-panel" aria-label="Build steps">
          <div className="progress" role="group" aria-label="Steps">
            {plan.steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`tick ${i < stepIndex ? "past" : ""} ${i === stepIndex ? "now" : ""}`}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === stepIndex ? "step" : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>

          <div className="step-scroll" key={current?.id}>
            <div className="step-head">
              {current ? <WhoBadge step={current} /> : null}
              <span className="step-count">
                Step {stepIndex + 1} of {total}
              </span>
            </div>
            <h2>{current?.title ?? plan.title}</h2>
            <p className="step-text">{current?.body ?? plan.summary}</p>
            <StepParts plan={plan} stepIndex={stepIndex} />
            {!done && <p className="step-key">Orange is this piece. Blue outline is what comes next.</p>}
            {done && (
              <div className="done-card">
                <strong>You built it!</strong>
                <span>
                  {hasPaint(plan) && !current?.paint
                    ? "Compare it to the finished picture, then paint it if you like."
                    : "Compare it to the finished picture. High five."}
                </span>
                <Link className="btn" to="/">
                  <Icon name="home" /> Pick another project
                </Link>
              </div>
            )}
          </div>

          <nav className="step-nav" aria-label="Step navigation">
            <button type="button" className="btn btn-big" disabled={stepIndex === 0} onClick={() => go(stepIndex - 1)}>
              <Icon name="back" /> Back
            </button>
            <button type="button" className="btn btn-primary btn-big" disabled={done} onClick={() => go(stepIndex + 1)}>
              Next <Icon name="next" />
            </button>
          </nav>
        </aside>
      </main>
    </div>
  );
}
