import { useState, useEffect } from "react";

export const useMobile = (breakpoint = 768) => {
      const query = `(max-width: ${breakpoint}px)`;
      const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches);

      useEffect(() => {
            const mql = window.matchMedia(query);
            const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
            mql.addEventListener("change", handler);
            return () => mql.removeEventListener("change", handler);
      }, [query]);

      return isMobile;
};