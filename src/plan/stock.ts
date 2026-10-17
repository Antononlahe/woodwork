import { nestRects } from "./nest";
import type { Part, Plan, ShopLine, ToolLine } from "./types";

const PLY = [4, 6.5, 9, 12, 15, 18];
const KERF = 4;
const MARGIN = 10;
const ROUND_STICK_MM = 2400;

function plyFor(thickness: number): number {
  const fit = PLY.find((t) => t >= thickness - 1e-6);
  return fit ?? PLY[PLY.length - 1];
}

function boxFace(part: Extract<Part, { kind: "box" }>): { w: number; h: number; t: number } {
  const sides = [part.size.x, part.size.y, part.size.z].sort((a, b) => a - b);
  return { t: sides[0], w: sides[2], h: sides[1] };
}

function faceOf(part: Part): { w: number; h: number; t: number } | null {
  if (part.kind === "box" || part.kind === "wedge" || part.kind === "arch" || part.kind === "merlon") {
    return boxFace({ kind: "box", id: part.id, size: part.size });
  }
  if (part.kind === "disk") return { w: part.diameter, h: part.diameter, t: part.thickness };
  if (part.kind === "cone") return { w: part.diameter, h: part.diameter, t: 12 };
  if (part.kind === "stairs") {
    return { w: part.run * part.count, h: part.width, t: part.rise };
  }
  if (part.kind === "ring") return { w: part.outer, h: part.outer, t: part.thickness };
  return null;
}

export function computeShop(plan: Plan): ShopLine[] {
  const lines: ShopLine[] = [];
  const plyBuckets = new Map<number, { w: number; h: number }[]>();
  const packCount = new Map<string, number>();
  const longByDia = new Map<number, number>();

  for (const part of plan.parts) {
    const face = faceOf(part);
    if (face) {
      const layers = part.kind === "disk" && face.t > 12 ? Math.max(1, Math.round(face.t / 12)) : 1;
      const t = plyFor(layers > 1 ? 12 : face.t);
      const bucket = plyBuckets.get(t) ?? [];
      for (let i = 0; i < layers; i++) bucket.push({ w: face.w, h: face.h });
      plyBuckets.set(t, bucket);
      continue;
    }
    if (part.kind !== "dowel") continue;
    const shortPack = (part.diameter === 6 || part.diameter === 8) && part.length <= 40;
    if (shortPack) {
      const key = `${part.diameter}x40`;
      packCount.set(key, (packCount.get(key) ?? 0) + 1);
    } else {
      longByDia.set(part.diameter, (longByDia.get(part.diameter) ?? 0) + part.length);
    }
  }

  const plyTs = [...plyBuckets.keys()].sort((a, b) => a - b);
  for (const t of plyTs) {
    const sheet = nestRects(plyBuckets.get(t) ?? [], KERF, MARGIN);
    const w = Math.ceil(sheet.w);
    const h = Math.ceil(sheet.h);
    lines.push({
      id: `ply-${t}`,
      kind: "ply",
      label: `Vineer ${t} mm, ask them to cut ${w} × ${h} mm`,
      detail: "Full sheets are 1220 × 2440. One small cut is enough. Disks and rings come out of this, not a separate buy.",
      qty: 1,
    });
  }

  for (const [key, need] of packCount) {
    const [d] = key.split("x");
    lines.push({
      id: `pack-${key}`,
      kind: "dowel-pack",
      label: `Tüübel pack ${d} × 40 mm`,
      detail: `Need ${need} pegs. Packs are 30–200 pcs. Cut or sand to length if a peg is shorter than 40 mm.`,
      qty: 1,
    });
  }

  const dias = [...longByDia.keys()].sort((a, b) => a - b);
  for (const d of dias) {
    const total = longByDia.get(d) ?? 0;
    if (d === 8 || d === 10) {
      lines.push({
        id: `round-${d}`,
        kind: "round",
        label: `Ümarliist pine Ø${d} mm × 2.4 m`,
        detail: `You need about ${Math.ceil(total)} mm of cuts. Sold per stick (${ROUND_STICK_MM} mm). Leftover is normal.`,
        qty: 1,
      });
    } else {
      lines.push({
        id: `hobby-${d}`,
        kind: "hobby-round",
        label: `Hobby shop: Ø${d} mm ümarliist`,
        detail: `About ${Math.ceil(total)} mm total. ABC/K-Rauta often skip 3 mm and 5 mm. One thin stick if they have it.`,
        qty: 1,
      });
    }
  }

  lines.push({
    id: "pva",
    kind: "consumable",
    label: "PVA wood glue",
    detail: "Any woodworking PVA. One small bottle.",
    qty: 1,
  });
  lines.push({
    id: "paper",
    kind: "consumable",
    label: "Sandpaper 80 and 120",
    detail: "A few sheets. 80 to shape, 120 to finish.",
    qty: 1,
  });

  return lines;
}

export function computeTools(plan: Plan): ToolLine[] {
  const bits = new Set<number>();
  for (const part of plan.parts) {
    for (const hole of part.holes ?? []) bits.add(hole.diameter);
  }
  const sorted = [...bits].sort((a, b) => a - b);
  const advanced = plan.parts.some((p) =>
    ["cone", "wedge", "arch", "stairs", "merlon"].includes(p.kind),
  );
  const tools: ToolLine[] = [
    { id: "saw", icon: "saw", label: advanced ? "Jigsaw (adult)" : "Handsaw or jigsaw (adult)" },
    { id: "drill", icon: "drill", label: "Drill (adult)" },
  ];
  if (advanced) {
    tools.push({ id: "mitre", icon: "square", label: "Mitre box or cheap mitre saw" });
    tools.push({ id: "file", icon: "paper", label: "Files and a rasp" });
  }
  for (const bit of sorted) {
    tools.push({ id: `bit-${bit}`, icon: "bit", label: `Drill bit Ø${bit} mm` });
  }
  tools.push(
    { id: "square", icon: "square", label: "Ruler and square" },
    { id: "clamp", icon: "clamp", label: "Clamp, if you have one" },
    { id: "paper", icon: "paper", label: "Sandpaper 80 / 120" },
  );
  return tools;
}
