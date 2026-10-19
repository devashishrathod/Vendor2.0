import { useEffect, useRef, useState } from "react";

/**
 * Counts up from the previously shown value to `value` (ease-out), then
 * renders it through `format`. Skips the animation for users who prefer
 * reduced motion.
 *
 * @param {{ value: number, format?: (n: number) => string, duration?: number, className?: string }} props
 */
const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString("en-IN"), duration = 900, className }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const reduceMotion = prefersReducedMotion();
  const target = Number(value) || 0;

  useEffect(() => {
    if (reduceMotion) {
      fromRef.current = target;
      return undefined;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      setDisplay(current);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      fromRef.current = target;
    };
  }, [target, duration, reduceMotion]);

  return <span className={className}>{format(reduceMotion ? target : display)}</span>;
}
