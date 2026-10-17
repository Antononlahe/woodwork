import { expect, test } from "vitest";
import { nestRects } from "./nest";

test("four 55×20 rects nest into a real sheet", () => {
  const rects = Array.from({ length: 4 }, () => ({ w: 55, h: 20 }));
  const sheet = nestRects(rects, 4, 10);
  expect(sheet.w).toBeGreaterThanOrEqual(20);
  expect(sheet.h).toBeGreaterThanOrEqual(20);
  expect(sheet.w * sheet.h).toBeGreaterThanOrEqual(4 * 55 * 20);
});
