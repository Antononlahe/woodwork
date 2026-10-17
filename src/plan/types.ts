export type Vec3 = { x: number; y: number; z: number };
export type AxisDir = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

export type Hole = {
  id: string;
  diameter: number;
  at: Vec3;
  dir: AxisDir;
  through?: boolean;
  depth?: number;
};

export type BoxPart = { id: string; kind: "box"; size: Vec3; holes?: Hole[] };
export type DowelPart = {
  id: string;
  kind: "dowel";
  diameter: number;
  length: number;
  holes?: Hole[];
};
export type DiskPart = {
  id: string;
  kind: "disk";
  diameter: number;
  thickness: number;
  holes?: Hole[];
};
export type RingPart = {
  id: string;
  kind: "ring";
  outer: number;
  inner: number;
  thickness: number;
  holes?: Hole[];
};
export type ConePart = { id: string; kind: "cone"; diameter: number; height: number; holes?: Hole[] };
export type WedgePart = { id: string; kind: "wedge"; size: Vec3; holes?: Hole[] };
export type ArchPart = {
  id: string;
  kind: "arch";
  size: Vec3;
  opening: { width: number; height: number };
  holes?: Hole[];
};
export type StairsPart = {
  id: string;
  kind: "stairs";
  width: number;
  rise: number;
  run: number;
  count: number;
  holes?: Hole[];
};
export type MerlonPart = { id: string; kind: "merlon"; size: Vec3; holes?: Hole[] };
export type Part =
  | BoxPart
  | DowelPart
  | DiskPart
  | RingPart
  | ConePart
  | WedgePart
  | ArchPart
  | StairsPart
  | MerlonPart;

export type AssemblyItem = { part: string; at: Vec3; rot?: Vec3 };
export type Join = { from: string; into: string };
export type Step = {
  id: string;
  title: string;
  body: string;
  show: string[];
  highlight?: string[];
  join?: Join[];
};

export type Plan = {
  format: "woodwork/v0";
  id: string;
  title: string;
  summary: string;
  difficulty: "easy" | "medium" | "hard";
  time_minutes: number;
  finished_size: Vec3;
  iso_from?: Vec3;
  parts: Part[];
  assembly: AssemblyItem[];
  steps: Step[];
};

export type Diagnostic = {
  level: "error" | "warning";
  path: string;
  code: string;
  message: string;
};

export type BomLine = {
  key: string;
  kind: Part["kind"];
  label: string;
  qty: number;
  sampleId: string;
};

export type ShopLine = {
  id: string;
  kind: "ply" | "round" | "dowel-pack" | "hobby-round" | "consumable";
  label: string;
  detail: string;
  qty: number;
};

export type ToolLine = { id: string; icon: string; label: string };

export function hasBlockingErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((d) => d.level === "error");
}
