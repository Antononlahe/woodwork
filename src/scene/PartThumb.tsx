import type { Part } from "../plan/types";
import { partImage } from "./snapshot";
import { useImage } from "./useImage";

export function PartThumb({ part, painted = false }: { part: Part; painted?: boolean }) {
  const src = useImage(() => partImage(part, painted), `${part.id}|${painted}`);
  return src ? <img className="thumb-img" src={src} alt="" /> : <span className="thumb-wait" aria-hidden />;
}
