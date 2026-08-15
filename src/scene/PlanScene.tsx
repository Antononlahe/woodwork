import { Bounds, Grid, OrbitControls, OrthographicCamera, Outlines, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import type { Plan } from "../plan/types";
import { buildPart, woodColor } from "./buildPart";
import { assemblyPosition, assemblyQuaternion } from "./pose";

export type ViewMode = "orbit" | "iso";

type PlanSceneProps = {
  plan: Plan;
  view: ViewMode;
  stepIndex: number;
};

function visibleIds(plan: Plan, stepIndex: number): Set<string> | null {
  if (stepIndex >= plan.steps.length) return null;
  return new Set(plan.steps[stepIndex].show);
}

function highlightRefs(plan: Plan, stepIndex: number): Set<string> {
  if (stepIndex >= plan.steps.length) return new Set();
  return new Set(plan.steps[stepIndex].highlight ?? []);
}

function Assembly({ plan, stepIndex }: { plan: Plan; stepIndex: number }) {
  const show = visibleIds(plan, stepIndex);
  const highlights = highlightRefs(plan, stepIndex);
  const byId = useMemo(() => new Map(plan.parts.map((p) => [p.id, p])), [plan]);
  const built = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildPart>>();
    for (const part of plan.parts) map.set(part.id, buildPart(part));
    return map;
  }, [plan]);

  return (
    <group>
      {plan.assembly.map((item) => {
        const part = byId.get(item.part);
        const mesh = built.get(item.part);
        if (!part || !mesh) return null;
        if (show && !show.has(part.id)) return null;
        const pos = assemblyPosition(item.at);
        const quat = assemblyQuaternion(item.rot);
        const marked = highlights.has(part.id) || [...highlights].some((h) => h.startsWith(`${part.id}.`));
        return (
          <group key={`${item.part}-${item.at.x}-${item.at.y}-${item.at.z}`} position={pos} quaternion={quat}>
            <mesh geometry={mesh.geometry} castShadow receiveShadow>
              <meshStandardMaterial color={woodColor(part)} roughness={0.82} metalness={0} />
              {marked ? <Outlines thickness={2.2} color="#6b2d12" /> : null}
            </mesh>
            {mesh.extras.map((geo, i) => (
              <mesh key={i} geometry={geo}>
                <meshStandardMaterial color="#3a2416" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

export function PlanScene({ plan, view, stepIndex }: PlanSceneProps) {
  return (
    <Canvas shadows gl={{ antialias: true, preserveDrawingBuffer: true }} style={{ background: "#e8d7b8" }}>
      {view === "orbit" ? (
        <PerspectiveCamera makeDefault position={[180, 160, 180]} fov={40} near={0.1} far={4000} />
      ) : (
        <OrthographicCamera makeDefault position={[220, 220, 220]} zoom={2.4} near={0.1} far={4000} />
      )}
      <ambientLight intensity={0.7} />
      <directionalLight position={[120, 220, 80]} intensity={1.15} castShadow />
      <directionalLight position={[-80, 80, -40]} intensity={0.25} />
      <Bounds fit clip observe margin={1.35}>
        <Assembly plan={plan} stepIndex={stepIndex} />
      </Bounds>
      <Grid
        infiniteGrid
        fadeDistance={600}
        sectionColor="#8a6a3a"
        cellColor="#c4a574"
        sectionSize={50}
        cellSize={10}
      />
      <OrbitControls
        makeDefault
        enableRotate={view === "orbit"}
        enablePan={view === "orbit"}
        minDistance={40}
        maxDistance={800}
      />
    </Canvas>
  );
}
