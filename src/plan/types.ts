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
export type Part = BoxPart | DowelPart | DiskPart | RingPart;

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

export type BomLine = { key: string; kind: Part["kind"]; label: string; qty: number };

export function hasBlockingErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((d) => d.level === "error");
}
