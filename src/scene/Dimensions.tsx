import { Html, Line } from "@react-three/drei";
import { Vector3 } from "three";
import type { Part, Vec3 } from "../plan/types";
import { partDimSpecs, type DimSpec } from "./dimSpecs";
import { yamlToThreeVec } from "./world";

function v(p: Vec3): Vector3 {
  return yamlToThreeVec(p);
}

function DimMark({ spec, muted }: { spec: DimSpec; muted?: boolean }) {
  const a = v(spec.a);
  const b = v(spec.b);
  const o = v(spec.offset);
  const a2 = a.clone().add(o);
  const b2 = b.clone().add(o);
  const mid = a2.clone().add(b2).multiplyScalar(0.5);
  const extra = o.length() === 0 ? new Vector3(0, 1, 0) : o.clone().normalize().multiplyScalar(2.2);
  const color = muted ? "#8a6a3a" : "#3a1f10";

  return (
    <group>
      <Line points={[a, a2.clone().add(extra)]} color={color} lineWidth={1.15} />
      <Line points={[b, b2.clone().add(extra)]} color={color} lineWidth={1.15} />
      <Line points={[a2, b2]} color={color} lineWidth={1.35} />
      <Html center position={mid} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
        <span className={`dim-label ${muted ? "dim-label-muted" : ""}`}>{spec.label}</span>
      </Html>
    </group>
  );
}

export function PartDimensions({
  part,
  muted,
  body = true,
  holes = [],
}: {
  part: Part;
  muted?: boolean;
  body?: boolean;
  holes?: string[];
}) {
  const specs = partDimSpecs(part, true).filter((spec) => {
    const holeId = spec.id.includes(".") ? spec.id.slice(spec.id.indexOf(".") + 1) : null;
    if (holeId) return holes.includes(holeId);
    return body;
  });
  return (
    <group>
      {specs.map((spec) => (
        <DimMark key={spec.id} spec={spec} muted={muted} />
      ))}
    </group>
  );
}
