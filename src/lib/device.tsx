import { createBreakpoints } from "@solid-primitives/media";

// Must be in small to large order
const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
};

export const useBreakpoint = () => createBreakpoints(breakpoints);

export const useIsMobile = () => {
  const bp = useBreakpoint();
  return () => !bp.md;
};
