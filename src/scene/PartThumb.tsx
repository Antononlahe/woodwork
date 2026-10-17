import { Bounds, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import type { Part } from "../plan/types";
import { buildPart, woodColor } from "./buildPart";

export function PartThumb({ part }: { part: Part }) {
  const built = useMemo(() => buildPart(part), [part]);
  return (
    <Canvas gl={{ antialias: true }} camera={{ position: [1, 0.9, 1] }} style={{ background: "#efe0c2" }}>
      <OrthographicCamera makeDefault position={[80, 70, 80]} zoom={1} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[40, 80, 20]} intensity={1} />
      <Bounds fit clip observe margin={1.35}>
        <mesh geometry={built.geometry}>
          <meshStandardMaterial color={woodColor(part)} roughness={0.82} />
        </mesh>
      </Bounds>
    </Canvas>
  );
}
