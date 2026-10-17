/** Writes public/plans/tabletop-castle.ww.yaml — detailed v2 fortress. */
import { writeFileSync } from "node:fs";

const parts = [];
const assembly = [];
const allIds = [];

function add(part, at, rot) {
  parts.push(part);
  allIds.push(part.id);
  const item = { part: part.id, at };
  if (rot) item.rot = rot;
  assembly.push(item);
}

function yamlVec(v) {
  const bits = Object.entries(v).map(([k, val]) => `${k}: ${val}`);
  return `{ ${bits.join(", ")} }`;
}

function emitPart(p) {
  let s = `  - id: ${p.id}\n    kind: ${p.kind}\n`;
  if (p.size) s += `    size: ${yamlVec(p.size)}\n`;
  if (p.diameter !== undefined) s += `    diameter: ${p.diameter}\n`;
  if (p.height !== undefined) s += `    height: ${p.height}\n`;
  if (p.thickness !== undefined) s += `    thickness: ${p.thickness}\n`;
  if (p.length !== undefined) s += `    length: ${p.length}\n`;
  if (p.width !== undefined) s += `    width: ${p.width}\n`;
  if (p.rise !== undefined) s += `    rise: ${p.rise}\n`;
  if (p.run !== undefined) s += `    run: ${p.run}\n`;
  if (p.count !== undefined) s += `    count: ${p.count}\n`;
  if (p.outer !== undefined) s += `    outer: ${p.outer}\n`;
  if (p.inner !== undefined) s += `    inner: ${p.inner}\n`;
  if (p.opening) s += `    opening: ${yamlVec(p.opening)}\n`;
  if (p.holes) {
    s += `    holes:\n`;
    for (const h of p.holes) {
      s += `      - id: ${h.id}\n        diameter: ${h.diameter}\n`;
      if (h.through) s += `        through: true\n`;
      if (h.depth !== undefined) s += `        depth: ${h.depth}\n`;
      s += `        at: ${yamlVec(h.at)}\n        dir: ${h.dir}\n`;
    }
  }
  return s;
}

function emitAsm(item) {
  let s = `  - part: ${item.part}\n    at: ${yamlVec(item.at)}\n`;
  if (item.rot) s += `    rot: ${yamlVec(item.rot)}\n`;
  return s;
}

// --- plate ---
add(
  {
    id: "plate",
    kind: "box",
    size: { x: 360, y: 360, z: 12 },
    holes: [
      { id: "sw", diameter: 8, depth: 8, at: { x: 44, y: 44, z: 12 }, dir: "-z" },
      { id: "se", diameter: 8, depth: 8, at: { x: 316, y: 44, z: 12 }, dir: "-z" },
      { id: "nw", diameter: 8, depth: 8, at: { x: 44, y: 316, z: 12 }, dir: "-z" },
      { id: "ne", diameter: 8, depth: 8, at: { x: 316, y: 316, z: 12 }, dir: "-z" },
    ],
  },
  { x: 0, y: 0, z: 0 },
);

const corners = [
  ["sw", 44, 44],
  ["se", 316, 44],
  ["nw", 44, 316],
  ["ne", 316, 316],
];

for (const [name, x, y] of corners) {
  add({ id: `pin-${name}`, kind: "dowel", diameter: 8, length: 20 }, { x, y, z: 4 });
  for (let i = 0; i < 8; i++) {
    add(
      { id: `tw-${name}-${i}`, kind: "disk", diameter: 56, thickness: 12 },
      { x, y, z: 18 + i * 12 },
    );
  }
  add({ id: `tw-${name}-top`, kind: "disk", diameter: 64, thickness: 12 }, { x, y, z: 114 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const mx = Math.round(x + Math.cos(a) * 28);
    const my = Math.round(y + Math.sin(a) * 28);
    add({ id: `tm-${name}-${k}`, kind: "merlon", size: { x: 8, y: 8, z: 12 } }, { x: mx - 4, y: my - 4, z: 120 });
  }
  add({ id: `cap-${name}`, kind: "cone", diameter: 40, height: 46 }, { x, y, z: 120 });
  add({ id: `pole-${name}`, kind: "dowel", diameter: 8, length: 28 }, { x, y, z: 160 });
  add({ id: `flag-${name}`, kind: "merlon", size: { x: 22, y: 3, z: 12 } }, { x: x + 4, y: y - 1, z: 176 });
}

// walls
add({ id: "wall-w", kind: "box", size: { x: 12, y: 216, z: 84 } }, { x: 38, y: 72, z: 12 });
add({ id: "wall-e", kind: "box", size: { x: 12, y: 216, z: 84 } }, { x: 310, y: 72, z: 12 });
add({ id: "wall-n", kind: "box", size: { x: 216, y: 12, z: 84 } }, { x: 72, y: 310, z: 12 });
add(
  { id: "gate", kind: "arch", size: { x: 216, y: 16, z: 84 }, opening: { width: 44, height: 56 } },
  { x: 72, y: 36, z: 12 },
);

// wall walks
add({ id: "walk-w", kind: "box", size: { x: 16, y: 200, z: 6 } }, { x: 50, y: 80, z: 90 });
add({ id: "walk-e", kind: "box", size: { x: 16, y: 200, z: 6 } }, { x: 294, y: 80, z: 90 });
add({ id: "walk-n", kind: "box", size: { x: 200, y: 16, z: 6 } }, { x: 80, y: 294, z: 90 });
add({ id: "walk-s", kind: "box", size: { x: 80, y: 14, z: 6 } }, { x: 76, y: 52, z: 90 });
add({ id: "walk-s2", kind: "box", size: { x: 80, y: 14, z: 6 } }, { x: 204, y: 52, z: 90 });

// merlons on walls
function wallMerlons(prefix, coords) {
  coords.forEach(([x, y], i) => {
    add({ id: `${prefix}-${i}`, kind: "merlon", size: { x: 10, y: 10, z: 14 } }, { x, y, z: 96 });
  });
}
const wy = [];
for (let y = 80; y <= 272; y += 16) wy.push(y);
wallMerlons(
  "mw",
  wy.map((y) => [38, y]),
);
wallMerlons(
  "me",
  wy.map((y) => [312, y]),
);
const nx = [];
for (let x = 80; x <= 272; x += 16) nx.push(x);
wallMerlons(
  "mn",
  nx.map((x) => [x, 312]),
);
const sx = [];
for (let x = 80; x <= 272; x += 16) {
  if (x < 148 || x > 204) sx.push(x);
}
wallMerlons(
  "ms",
  sx.map((x) => [x, 38]),
);

// portcullis
for (let i = 0; i < 5; i++) {
  add({ id: `bar-${i}`, kind: "box", size: { x: 4, y: 4, z: 48 } }, { x: 158 + i * 9, y: 42, z: 14 });
}

// keep
add({ id: "keep-floor", kind: "box", size: { x: 84, y: 84, z: 12 } }, { x: 138, y: 138, z: 12 });
add(
  { id: "keep-s", kind: "arch", size: { x: 84, y: 12, z: 52 }, opening: { width: 22, height: 34 } },
  { x: 138, y: 138, z: 24 },
);
add(
  { id: "keep-n", kind: "arch", size: { x: 84, y: 12, z: 52 }, opening: { width: 16, height: 20 } },
  { x: 138, y: 210, z: 24 },
);
add(
  { id: "keep-w", kind: "arch", size: { x: 60, y: 12, z: 52 }, opening: { width: 16, height: 20 } },
  { x: 150, y: 150, z: 24 },
  { x: 0, y: 0, z: 90 },
);
add(
  { id: "keep-e", kind: "arch", size: { x: 60, y: 12, z: 52 }, opening: { width: 16, height: 20 } },
  { x: 222, y: 150, z: 24 },
  { x: 0, y: 0, z: 90 },
);
add({ id: "keep-roof", kind: "wedge", size: { x: 88, y: 88, z: 30 } }, { x: 136, y: 136, z: 76 });
for (let i = 0; i < 6; i++) {
  add({ id: `km-${i}`, kind: "merlon", size: { x: 8, y: 8, z: 10 } }, { x: 140 + i * 14, y: 136, z: 76 });
}

// courtyard
add({ id: "well-ring", kind: "ring", outer: 32, inner: 16, thickness: 12 }, { x: 110, y: 250, z: 18 });
add({ id: "well-pit", kind: "disk", diameter: 16, thickness: 4 }, { x: 110, y: 250, z: 14 });
add({ id: "shed", kind: "box", size: { x: 36, y: 28, z: 24 } }, { x: 250, y: 250, z: 12 });
add({ id: "shed-roof", kind: "wedge", size: { x: 40, y: 32, z: 16 } }, { x: 248, y: 248, z: 36 });

add({ id: "stair", kind: "stairs", width: 28, rise: 12, run: 11, count: 7 }, { x: 198, y: 54, z: 12 }, { x: 0, y: 0, z: 90 });
add({ id: "stoop", kind: "box", size: { x: 50, y: 16, z: 8 } }, { x: 155, y: 20, z: 12 });

const merlonIds = allIds.filter((id) => id.startsWith("mw-") || id.startsWith("me-") || id.startsWith("mn-") || id.startsWith("ms-") || id.startsWith("tm-") || id.startsWith("km-"));
const towerCourseIds = allIds.filter((id) => id.startsWith("tw-"));
const barIds = allIds.filter((id) => id.startsWith("bar-"));
const capIds = allIds.filter((id) => id.startsWith("cap-"));
const poleIds = allIds.filter((id) => id.startsWith("pole-"));
const flagIds = allIds.filter((id) => id.startsWith("flag-"));
const pinIds = allIds.filter((id) => id.startsWith("pin-"));

const steps = [
  {
    id: "cut-plate",
    title: "Cut the ground plate",
    body: "Cut a 360mm square from 12mm vineer. Drill four 8mm holes, 8mm deep, 44mm in from each corner. This is the yard. Everything stands on it.",
    show: ["plate"],
    highlight: ["plate.sw", "plate.se"],
  },
  {
    id: "pin-corners",
    title: "Plant the corner pins",
    body: "Glue four 8mm pegs in the corner holes. These locate the towers.",
    show: ["plate", ...pinIds],
    join: pinIds.map((id) => ({ from: id, into: `plate.${id.slice(4)}` })),
  },
  {
    id: "stack-towers",
    title: "Stack the tower drums",
    body: "Each tower is eight Ø56 disks, 12mm thick, glued into a drum. Jigsaw the circles. Stack them on the pins. Keep the sides flush.",
    show: ["plate", ...pinIds, ...towerCourseIds.filter((id) => !id.endsWith("-top"))],
  },
  {
    id: "tower-crowns",
    title: "Crown the towers",
    body: "Glue a Ø64 disk on each drum as a fighting top. Mitre eight 8mm merlons around the rim. Then glue a Ø42 cone in the middle.",
    show: [
      ...towerCourseIds.filter((id) => id.endsWith("-7") || id.endsWith("-top")),
      ...allIds.filter((id) => id.startsWith("tm-")),
      ...capIds,
    ],
  },
  {
    id: "cut-walls",
    title: "Cut the curtain walls",
    body: "Three walls 216 by 84mm. The front is 16mm thick with a 44 by 56mm arch. Jigsaw the curve and file it.",
    show: ["wall-w", "wall-e", "wall-n", "gate"],
  },
  {
    id: "stand-walls",
    title: "Stand the walls",
    body: "Glue the walls between the towers, on the plate. The arch faces the front. The 12mm faces kiss the drums.",
    show: ["plate", "tw-sw-0", "tw-se-0", "tw-nw-0", "tw-ne-0", "wall-w", "wall-e", "wall-n", "gate"],
  },
  {
    id: "walks",
    title: "Lay the wall walks",
    body: "Cut 6mm planks and glue them on the inside of each wall, just under the merlon line. Two short walks flank the gate.",
    show: ["wall-w", "wall-e", "wall-n", "gate", "walk-w", "walk-e", "walk-n", "walk-s", "walk-s2"],
  },
  {
    id: "merlons",
    title: "Tooth the battlements",
    body: "Mitre 10 by 10mm blocks, 14mm tall. Glue them along every wall top with a gap between. Skip the arch.",
    show: ["wall-w", "wall-e", "wall-n", "gate", "mw-0", "mw-1", "me-0", "mn-0", "ms-0", "ms-1"],
  },
  {
    id: "portcullis",
    title: "Hang the portcullis",
    body: "Five 4 by 4mm bars, 48mm long. Glue them in the arch, spaced 9mm. They read as a grate.",
    show: ["gate", ...barIds],
  },
  {
    id: "keep-shell",
    title: "Raise the keep",
    body: "An 84mm floor. Four walls: an arched door on the south, three small window arches. Mitre a wedge roof. Glue merlons on the front eave.",
    show: ["keep-floor", "keep-s", "keep-n", "keep-w", "keep-e", "keep-roof", "km-0", "km-1", "km-2"],
  },
  {
    id: "yard",
    title: "Furnish the yard",
    body: "A well: ring and a thin disk in the pit. A 36mm shed with a wedge roof in the far corner. A seven-tread stair inside the gate, up to the walk. A stoop slab outside the arch.",
    show: ["plate", "gate", "well-ring", "well-pit", "shed", "shed-roof", "stair", "stoop"],
  },
  {
    id: "flags",
    title: "Fly the colours",
    body: "An 8mm pole on each cone, and a thin pennant. Four flags.",
    show: [...capIds, ...poleIds, ...flagIds],
  },
  {
    id: "walk",
    title: "Walk the walls",
    body: "You should have a plate, four drum towers with fighting tops, cones and flags, four walls with an arched grate, merlons, wall walks, a keep with windows and a roof, a well, a shed, a stair, and a stoop. Look through the gate. Compare it to the finished picture in the corner.",
    show: allIds,
  },
];

function emitStep(st) {
  let s = `  - id: ${st.id}\n    title: ${JSON.stringify(st.title)}\n    body: ${JSON.stringify(st.body)}\n    show: [${st.show.join(", ")}]\n`;
  if (st.highlight) s += `    highlight: [${st.highlight.join(", ")}]\n`;
  if (st.join) {
    s += `    join:\n`;
    for (const j of st.join) s += `      - from: ${j.from}\n        into: ${j.into}\n`;
  }
  return s;
}

const yaml = `format: woodwork/v0
id: tabletop-castle
title: Tabletop castle
summary: A detailed curtain-wall fortress. Drum towers, grate, keep, well, shed, merlons.
difficulty: hard
time_minutes: 240
finished_size: { x: 360, y: 360, z: 200 }
iso_from: { x: 0.95, y: -1.3, z: 0.7 }

parts:
${parts.map(emitPart).join("")}
assembly:
${assembly.map(emitAsm).join("")}
steps:
${steps.map(emitStep).join("")}`;

writeFileSync(new URL("../public/plans/tabletop-castle.ww.yaml", import.meta.url), yaml);
console.log(`parts ${parts.length} steps ${steps.length}`);
