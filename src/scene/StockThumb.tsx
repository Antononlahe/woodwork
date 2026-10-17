import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import type { ShopLine } from "../plan/types";
import { objectImage } from "./snapshot";
import { useImage } from "./useImage";

const wood = (color: string) => new MeshStandardMaterial({ color, roughness: 0.82 });

type Kind = "ply" | "round" | "pack";

const BUILD: Record<Kind, () => Group> = {
  ply: () => new Group().add(new Mesh(new BoxGeometry(70, 6, 50), wood("#d4b483"))),
  round: () => {
    const m = new Mesh(new CylinderGeometry(4, 4, 70, 20), wood("#c4a574"));
    m.rotation.z = 1.15;
    return new Group().add(m);
  },
  pack: () => {
    const g = new Group();
    for (const x of [-10, 0, 10]) {
      const m = new Mesh(new CylinderGeometry(3.2, 3.2, 22, 16), wood("#c4a574"));
      m.position.x = x;
      g.add(m);
    }
    return g;
  },
};

// Long-lived owners: the picture cache hangs off these.
const OWNER: Record<Kind, object> = { ply: {}, round: {}, pack: {} };

export function ShopThumb({ line }: { line: ShopLine }) {
  const kind: Kind = line.kind === "ply" ? "ply" : line.kind === "dowel-pack" ? "pack" : "round";
  const photo = line.kind === "consumable";
  const src = useImage(
    () => (photo ? Promise.resolve("") : objectImage(OWNER[kind], kind, BUILD[kind])),
    line.id,
  );
  if (photo) {
    return <img className="thumb-img cover" src={line.id === "pva" ? "/prep/pva.jpg" : "/prep/paper.jpg"} alt="" />;
  }
  return src ? <img className="thumb-img" src={src} alt="" /> : <span className="thumb-wait" aria-hidden />;
}

export function ToolThumb({ icon }: { icon: string }) {
  return <img className="thumb-img cover" src={`/prep/${icon}.jpg`} alt="" />;
}
