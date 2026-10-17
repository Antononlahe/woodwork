import { useEffect, useRef, useState } from "react";

/** Resolves a baked picture. `key` says when to load again. */
export function useImage(load: () => Promise<string>, key: string): string | undefined {
  const [src, setSrc] = useState<string>();
  const fn = useRef(load);
  fn.current = load;
  useEffect(() => {
    let live = true;
    setSrc(undefined);
    fn.current()
      .then((url) => live && setSrc(url))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [key]);
  return src;
}
