export type Rect = { w: number; h: number };

export function nestRects(rects: Rect[], kerf: number, margin: number): Rect {
  if (rects.length === 0) return { w: 0, h: 0 };

  const pieces = rects.map((r) => (r.w < r.h ? { w: r.h, h: r.w } : { w: r.w, h: r.h }));
  pieces.sort((a, b) => b.h - a.h || b.w - a.w);

  const area = pieces.reduce((sum, p) => sum + p.w * p.h, 0);
  const maxSide = Math.max(...pieces.map((p) => p.w));
  const targetW = Math.max(maxSide, Math.ceil(Math.sqrt(area)));

  let sheetW = 0;
  let sheetH = 0;
  let rowW = 0;
  let rowH = 0;

  for (const piece of pieces) {
    const next = rowW === 0 ? piece.w : rowW + kerf + piece.w;
    if (rowW > 0 && next > targetW) {
      sheetH += (sheetH === 0 ? 0 : kerf) + rowH;
      sheetW = Math.max(sheetW, rowW);
      rowW = piece.w;
      rowH = piece.h;
    } else {
      rowW = next;
      rowH = Math.max(rowH, piece.h);
    }
  }
  sheetH += (sheetH === 0 ? 0 : kerf) + rowH;
  sheetW = Math.max(sheetW, rowW);

  return { w: sheetW + 2 * margin, h: sheetH + 2 * margin };
}
