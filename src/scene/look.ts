import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";
import type { Part } from "../plan/types";
import { woodColor } from "./buildPart";

let grain: CanvasTexture | undefined;

/** Faint horizontal grain, multiplied over the base colour. Made once, shared by every renderer. */
export function grainTexture(): CanvasTexture | undefined {
  if (grain) return grain;
  if (typeof document === "undefined") return undefined;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  if (!g) return undefined;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) {
    const y = rnd() * 256;
    const amp = 1 + rnd() * 3;
    g.strokeStyle = `rgba(110,70,30,${0.04 + rnd() * 0.09})`;
    g.lineWidth = 0.6 + rnd() * 1.6;
    g.beginPath();
    for (let x = 0; x <= 256; x += 8) {
      const yy = y + Math.sin(x / 38 + i) * amp;
      if (x === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.stroke();
  }
  grain = new CanvasTexture(c);
  grain.wrapS = grain.wrapT = RepeatWrapping;
  grain.colorSpace = SRGBColorSpace;
  return grain;
}

export function partMaterial(part: Part, painted: boolean): MeshStandardMaterial {
  const isPainted = painted && !!part.paint;
  return new MeshStandardMaterial({
    color: woodColor(part, painted),
    roughness: isPainted ? 0.5 : 0.78,
    map: grainTexture() ?? null,
  });
}
