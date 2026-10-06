"use client";
import { useEffect, useRef } from "react";

/**
 * Counts up to `value` once, the first time it scrolls into view. Server HTML holds the
 * final number, so nothing looks wrong without JS; if the number is already on screen
 * when the page loads, or reduced motion is on, it just stays put.
 */
export function CountUp({ value, decimals = 0, duration = 900 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const show = (n: number) => (el.textContent = n.toFixed(decimals));
    let armed = false;
    let raf = 0;

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        // Below the fold on first check: arm it, starting from zero.
        if (!armed) {
          armed = true;
          show(0);
        }
        return;
      }
      io.disconnect();
      if (!armed) return; // was already visible on load: keep the final value
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        show(value * (1 - (1 - t) ** 3));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, decimals, duration]);

  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}
