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

type Base = { id: string; paint?: string; holes?: Hole[] };

export type BoxPart = Base & { kind: "box"; size: Vec3 };
export type DowelPart = Base & { kind: "dowel"; diameter: number; length: number };
export type DiskPart = Base & { kind: "disk"; diameter: number; thickness: number };
export type RingPart = Base & { kind: "ring"; outer: number; inner: number; thickness: number };
export type ConePart = Base & { kind: "cone"; diameter: number; height: number };
export type WedgePart = Base & { kind: "wedge"; size: Vec3 };
export type ArchPart = Base & { kind: "arch"; size: Vec3; opening: { width: number; height: number } };
export type StairsPart = Base & { kind: "stairs"; width: number; rise: number; run: number; count: number };
export type MerlonPart = Base & { kind: "merlon"; size: Vec3 };
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
  /** Force the grown-up (or kid) badge. Default: guessed from the text. */
  adult?: boolean;
  /** Optional paint step: parts show their `paint` colour from here on. */
  paint?: boolean;
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
