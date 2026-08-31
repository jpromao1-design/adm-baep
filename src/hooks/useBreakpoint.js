import { useEffect, useState } from 'react';

/** COMPACT: smartphone | MEDIUM: tablet | EXPANDED: desktop */
export const BREAKPOINTS = { compact: 768, medium: 1024 };

export function getBreakpoint(width) {
  if (width < BREAKPOINTS.compact) return 'compact';
  if (width < BREAKPOINTS.medium) return 'medium';
  return 'expanded';
}

export function useBreakpoint() {
  const [bp, setBp] = useState(() =>
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'expanded'
  );

  useEffect(() => {
    const mqCompact = window.matchMedia(`(max-width: ${BREAKPOINTS.compact - 1}px)`);
    const mqMedium = window.matchMedia(`(max-width: ${BREAKPOINTS.medium - 1}px)`);

    const update = () => setBp(getBreakpoint(window.innerWidth));
    update();
    mqCompact.addEventListener('change', update);
    mqMedium.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      mqCompact.removeEventListener('change', update);
      mqMedium.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return {
    breakpoint: bp,
    isCompact: bp === 'compact',
    isMedium: bp === 'medium',
    isExpanded: bp === 'expanded',
    isMobile: bp === 'compact',
    isDesktop: bp === 'expanded',
  };
}
