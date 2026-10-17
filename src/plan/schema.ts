import * as z from "zod";
import type { Plan } from "./types";

const vec3 = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const axisDir = z.enum(["+x", "-x", "+y", "-y", "+z", "-z"]);

const holeSchema = z
  .object({
    id: z.string().min(1),
    diameter: z.number().positive(),
    at: vec3,
    dir: axisDir,
    through: z.boolean().optional(),
    depth: z.number().positive().optional(),
  })
  .superRefine((hole, ctx) => {
    const through = hole.through === true;
    const hasDepth = hole.depth !== undefined;
    if (through === hasDepth) {
      ctx.addIssue({
        code: "custom",
        message: "hole needs through: true xor a depth",
        path: ["depth"],
      });
    }
  });

const boxPart = z.object({
  id: z.string().min(1),
  kind: z.literal("box"),
  size: z.object({
    x: z.number().positive(),
    y: z.number().positive(),
    z: z.number().positive(),
  }),
  holes: z.array(holeSchema).optional(),
});

const dowelPart = z.object({
  id: z.string().min(1),
  kind: z.literal("dowel"),
  diameter: z.number().positive(),
  length: z.number().positive(),
  holes: z.array(holeSchema).optional(),
});

const diskPart = z.object({
  id: z.string().min(1),
  kind: z.literal("disk"),
  diameter: z.number().positive(),
  thickness: z.number().positive(),
  holes: z.array(holeSchema).optional(),
});

const ringPart = z.object({
  id: z.string().min(1),
  kind: z.literal("ring"),
  outer: z.number().positive(),
  inner: z.number().positive(),
  thickness: z.number().positive(),
  holes: z.array(holeSchema).optional(),
});

const conePart = z.object({
  id: z.string().min(1),
  kind: z.literal("cone"),
  diameter: z.number().positive(),
  height: z.number().positive(),
  holes: z.array(holeSchema).optional(),
});

const wedgePart = z.object({
  id: z.string().min(1),
  kind: z.literal("wedge"),
  size: z.object({
    x: z.number().positive(),
    y: z.number().positive(),
    z: z.number().positive(),
  }),
  holes: z.array(holeSchema).optional(),
});

const archPart = z.object({
  id: z.string().min(1),
  kind: z.literal("arch"),
  size: z.object({
    x: z.number().positive(),
    y: z.number().positive(),
    z: z.number().positive(),
  }),
  opening: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  holes: z.array(holeSchema).optional(),
});

const stairsPart = z.object({
  id: z.string().min(1),
  kind: z.literal("stairs"),
  width: z.number().positive(),
  rise: z.number().positive(),
  run: z.number().positive(),
  count: z.number().int().positive(),
  holes: z.array(holeSchema).optional(),
});

const merlonPart = z.object({
  id: z.string().min(1),
  kind: z.literal("merlon"),
  size: z.object({
    x: z.number().positive(),
    y: z.number().positive(),
    z: z.number().positive(),
  }),
  holes: z.array(holeSchema).optional(),
});

const partSchema = z.discriminatedUnion("kind", [
  boxPart,
  dowelPart,
  diskPart,
  ringPart,
  conePart,
  wedgePart,
  archPart,
  stairsPart,
  merlonPart,
]);

export const planSchema: z.ZodType<Plan> = z
  .object({
    format: z.literal("woodwork/v0"),
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard"]),
    time_minutes: z.number().positive(),
    finished_size: z.object({
      x: z.number().positive(),
      y: z.number().positive(),
      z: z.number().positive(),
    }),
    iso_from: vec3.optional(),
    parts: z.array(partSchema).min(1),
    assembly: z.array(
      z.object({
        part: z.string().min(1),
        at: vec3,
        rot: vec3.optional(),
      }),
    ),
    steps: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
        show: z.array(z.string().min(1)).min(1),
        highlight: z.array(z.string().min(1)).optional(),
        join: z
          .array(
            z.object({
              from: z.string().min(1),
              into: z.string().min(1),
            }),
          )
          .optional(),
      }),
    ),
  })
  .superRefine((plan, ctx) => {
    const partIds = new Set<string>();
    for (const [i, part] of plan.parts.entries()) {
      if (partIds.has(part.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate part id ${part.id}`,
          path: ["parts", i, "id"],
        });
      }
      partIds.add(part.id);
      const holeIds = new Set<string>();
      for (const [j, hole] of (part.holes ?? []).entries()) {
        if (holeIds.has(hole.id)) {
          ctx.addIssue({
            code: "custom",
            message: `duplicate hole id ${hole.id}`,
            path: ["parts", i, "holes", j, "id"],
          });
        }
        holeIds.add(hole.id);
      }
      if (part.kind === "ring" && part.inner >= part.outer) {
        ctx.addIssue({
          code: "custom",
          message: "ring inner must be less than outer",
          path: ["parts", i, "inner"],
        });
      }
      if (part.kind === "arch") {
        if (part.opening.width >= part.size.x) {
          ctx.addIssue({
            code: "custom",
            message: "arch opening wider than the wall",
            path: ["parts", i, "opening", "width"],
          });
        }
        if (part.opening.height >= part.size.z) {
          ctx.addIssue({
            code: "custom",
            message: "arch opening taller than the wall",
            path: ["parts", i, "opening", "height"],
          });
        }
      }
    }
    const stepIds = new Set<string>();
    for (const [i, step] of plan.steps.entries()) {
      if (stepIds.has(step.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate step id ${step.id}`,
          path: ["steps", i, "id"],
        });
      }
      stepIds.add(step.id);
    }
  });
