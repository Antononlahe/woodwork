import { ContactShadows, Grid, Line, OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { DoubleSide } from "three";
import { worldAabb } from "../plan/aabb";
import type { Plan } from "../plan/types";
import { buildPartCached, woodColor, type BuiltPart } from "./buildPart";
import { FitCamera } from "./FitCamera";
import { grainTexture } from "./look";
import { assemblyPosition, assemblyQuaternion } from "./pose";
import { PartDimensions } from "./Dimensions";
import { currentIds, dimensionedIds, highlightedHoleIds, incomingIds, visibleIds } from "./stepView";
import { worldPointOnPart } from "./world";

const NOW = "#e06712";
const NEXT = "#1f6feb";

export type ViewMode = "orbit" | "iso";

type PlanSceneProps = {
  plan: Plan;
  view: ViewMode;
  stepIndex: number;
  showGrid?: boolean;
  interactive?: boolean;
  showDimensions?: boolean;
  /** Use each part's `paint` colour where it has one. */
  painted?: boolean;
};

function Assembly({
  plan,
  stepIndex,
  showDimensions,
  painted,
}: {
  plan: Plan;
  stepIndex: number;
  showDimensions: boolean;
  painted: boolean;
}) {
  const grain = grainTexture() ?? null;
  const show = visibleIds(plan, stepIndex);
  const incoming = incomingIds(plan, stepIndex);
  const current = currentIds(plan, stepIndex);
  const measured = dimensionedIds(plan, stepIndex);
  const byId = useMemo(() => new Map(plan.parts.map((p) => [p.id, p])), [plan]);
  const built = useMemo(() => {
    const map = new Map<string, BuiltPart>();
    for (const part of plan.parts) map.set(part.id, buildPartCached(part));
    return map;
  }, [plan]);

  return (
    <group>
      {plan.assembly.map((item) => {
        const part = byId.get(item.part);
        const mesh = built.get(item.part);
        if (!part || !mesh) return null;
        const isIncoming = incoming.has(part.id);
        const isSolid = !show || show.has(part.id);
        if (!isSolid && !isIncoming) return null;
        const pos = assemblyPosition(item.at);
        const quat = assemblyQuaternion(item.rot);
        const isNow = !isIncoming && current.has(part.id);
        return (
          <group key={`${item.part}-${item.at.x}-${item.at.y}-${item.at.z}`} position={pos} quaternion={quat}>
            <mesh geometry={mesh.geometry}>
              {isIncoming ? (
                <meshBasicMaterial color={NEXT} transparent opacity={0.14} depthWrite={false} toneMapped={false} />
              ) : isNow ? (
                <meshStandardMaterial
                  color="#f0c48a"
                  map={grain}
                  roughness={0.58}
                  metalness={0}
                  emissive={NOW}
                  emissiveIntensity={0.28}
                  side={DoubleSide}
                />
              ) : (
                <meshStandardMaterial
                  color={woodColor(part, painted)}
                  map={grain}
                  roughness={painted && part.paint ? 0.5 : 0.78}
                  metalness={0}
                  side={DoubleSide}
                />
              )}
            </mesh>
            <lineSegments geometry={mesh.outline}>
              <lineBasicMaterial
                color={isIncoming ? NEXT : isNow ? NOW : "#4a2c1a"}
                transparent
                opacity={isIncoming || isNow ? 1 : 0.35}
                toneMapped={false}
              />
            </lineSegments>
            {showDimensions && !isIncoming ? (
              <PartDimensions
                part={part}
                body={measured.has(part.id)}
                holes={highlightedHoleIds(plan, stepIndex, part.id)}
              />
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function OverallDimensions({ plan, ids }: { plan: Plan; ids: Set<string> }) {
  const byId = new Map(plan.parts.map((p) => [p.id, p]));
  let min = { x: Infinity, y: Infinity, z: Infinity };
  let max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const item of plan.assembly) {
    if (!ids.has(item.part)) continue;
    const part = byId.get(item.part);
    if (!part) continue;
    const box = worldAabb(part, item);
    min = {
      x: Math.min(min.x, box.min.x),
      y: Math.min(min.y, box.min.y),
      z: Math.min(min.z, box.min.z),
    };
    max = {
      x: Math.max(max.x, box.max.x),
      y: Math.max(max.y, box.max.y),
      z: Math.max(max.z, box.max.z),
    };
  }
  if (!Number.isFinite(min.x)) return null;
  const size = { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z };
  return (
    <group position={assemblyPosition(min)}>
      <PartDimensions part={{ id: "overall", kind: "box", size }} body holes={[]} />
    </group>
  );
}

function NextJoins({ plan, stepIndex }: { plan: Plan; stepIndex: number }) {
  const joins = stepIndex + 1 < plan.steps.length ? (plan.steps[stepIndex + 1].join ?? []) : [];
  const lines = [];
  for (const [i, join] of joins.entries()) {
    const a = worldPointOnPart(plan, join.from);
    const b = worldPointOnPart(plan, join.into);
    if (a && b) lines.push({ key: `${join.from}-${join.into}-${i}`, a, b });
  }

  return (
    <group>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={[line.a, line.b]}
          color={NEXT}
          dashed
          dashSize={4}
          gapSize={3}
          lineWidth={2}
        />
      ))}
    </group>
  );
}

export function PlanScene({
  plan,
  view,
  stepIndex,
  showGrid = true,
  interactive = true,
  showDimensions = true,
  painted = false,
}: PlanSceneProps) {
  const { x, y, z } = plan.finished_size;
  const span = Math.max(x, y, z);
  return (
    <Canvas className="scene" frameloop="demand" dpr={[1, 2]} gl={{ antialias: true }} style={{ background: "var(--stage)" }}>
      {view === "orbit" ? (
        <PerspectiveCamera makeDefault position={[180, 160, 180]} fov={38} near={0.1} far={4000} />
      ) : (
        <OrthographicCamera makeDefault position={[220, 220, 220]} zoom={1} near={0.1} far={4000} />
      )}
      <ambientLight intensity={0.95} />
      <hemisphereLight args={["#fff4dd", "#c4a574", 0.55]} />
      <directionalLight position={[120, 220, 80]} intensity={0.85} />
      <directionalLight position={[-80, 80, -40]} intensity={0.35} />
      <Assembly plan={plan} stepIndex={stepIndex} showDimensions={showDimensions} painted={painted} />
      <ContactShadows position={[x / 2, -0.4, -y / 2]} scale={span * 2.2} far={z + 20} blur={2.6} opacity={0.38} resolution={512} />
      {showDimensions &&
      stepIndex < plan.steps.length - 1 &&
      dimensionedIds(plan, stepIndex).size === 0 ? (
        <OverallDimensions
          plan={plan}
          ids={visibleIds(plan, stepIndex) ?? new Set(plan.parts.map((p) => p.id))}
        />
      ) : null}
      <NextJoins plan={plan} stepIndex={stepIndex} />
      {showGrid ? (
        <Grid
          infiniteGrid
          fadeDistance={700}
          sectionColor="#8a6a3a"
          cellColor="#c4a574"
          sectionSize={50}
          cellSize={10}
        />
      ) : null}
      <FitCamera plan={plan} stepIndex={stepIndex} view={view} />
      <OrbitControls
        makeDefault
        enableRotate={interactive && view === "orbit"}
        enablePan={interactive && view === "orbit"}
        enableZoom={interactive}
        minDistance={20}
        maxDistance={900}
      />
    </Canvas>
  );
}
