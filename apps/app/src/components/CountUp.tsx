import { useEffect, useRef, useState } from 'react';

/**
 * Eased count-up for stat numbers, ported from v1.
 * Honours prefers-reduced-motion by rendering the final value directly —
 * animation is decoration, the number is the information.
 */
export function CountUp({
  value,
  duration = 900,
  suffix = '',
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || duration <= 0) {
      setDisplay(value);
      return;
    }

    const from = 0;
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}
