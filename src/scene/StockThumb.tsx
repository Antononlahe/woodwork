import { Bounds, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { BoxGeometry, CylinderGeometry } from "three";
import type { ShopLine } from "../plan/types";

function PlyMesh() {
  return (
    <mesh geometry={new BoxGeometry(70, 6, 50)}>
      <meshStandardMaterial color="#d4b483" roughness={0.82} />
    </mesh>
  );
}

function StickMesh({ short }: { short?: boolean }) {
  const h = short ? 18 : 70;
  return (
    <mesh geometry={new CylinderGeometry(4, 4, h, 20)} rotation={[0, 0, short ? 0.4 : 1.15]}>
      <meshStandardMaterial color="#c4a574" roughness={0.82} />
    </mesh>
  );
}

function PackMesh() {
  return (
    <group>
      {[-10, 0, 10].map((x) => (
        <mesh key={x} position={[x, 0, 0]} geometry={new CylinderGeometry(3.2, 3.2, 22, 16)}>
          <meshStandardMaterial color="#c4a574" roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

export function ShopThumb({ line }: { line: ShopLine }) {
  if (line.kind === "consumable") {
    const src = line.id === "pva" ? "/prep/pva.jpg" : "/prep/paper.jpg";
    return <img className="prep-pic" src={src} alt="" />;
  }

  return (
    <Canvas gl={{ antialias: true }} style={{ background: "#efe0c2" }}>
      <OrthographicCamera makeDefault position={[50, 45, 50]} zoom={1} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[30, 50, 20]} intensity={1} />
      <Bounds fit clip observe margin={1.4}>
        {line.kind === "ply" ? <PlyMesh /> : null}
        {line.kind === "round" || line.kind === "hobby-round" ? <StickMesh /> : null}
        {line.kind === "dowel-pack" ? <PackMesh /> : null}
      </Bounds>
    </Canvas>
  );
}

export function ToolThumb({ icon }: { icon: string }) {
  return <img className="prep-pic" src={`/prep/${icon}.jpg`} alt="" />;
}
