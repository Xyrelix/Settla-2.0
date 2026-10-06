"use client";
import { useEffect, useRef } from "react";

// Points spread evenly over a sphere (Fibonacci lattice).
const N = 650;
const POINTS = Array.from({ length: N }, (_, i) => {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const t = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(t) * r, y, Math.sin(t) * r] as const;
});

const TILT = 0.35;
const SPIN = 0.18; // radians per second: one turn about every 35s

/**
 * Decorative dotted globe. It spins in on load, then keeps a slow steady turn (plus a
 * little extra with scroll). Stays still under reduced motion, and only draws while on
 * screen (requestAnimationFrame also pauses in background tabs). Colour comes from CSS
 * (`text-*` on the canvas) and follows the theme.
 */
export function GlobeBackdrop({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let color = "";
    let raf = 0;
    let visible = false;
    let lastAngle = NaN;

    const readColor = () => {
      color = getComputedStyle(canvas).color;
      lastAngle = NaN;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastAngle = NaN;
    };

    const draw = (angle: number) => {
      const { width: w, height: h } = canvas.getBoundingClientRect();
      const radius = Math.min(w, h) / 2 - 4;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const ct = Math.cos(TILT);
      const st = Math.sin(TILT);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (const [x, y, z] of POINTS) {
        const x1 = x * ca + z * sa;
        const z1 = -x * sa + z * ca;
        const y2 = y * ct - z1 * st;
        const z2 = y * st + z1 * ct;
        const front = z2 > 0;
        ctx.globalAlpha = front ? 0.2 + 0.65 * z2 : 0.07;
        ctx.beginPath();
        ctx.arc(w / 2 + x1 * radius, h / 2 + y2 * radius, front ? 1.6 : 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      let angle = 0.6;
      if (!reduce) {
        const p = Math.min((now - start) / 4000, 1);
        // fast spin-in that eases into the steady turn (same direction), plus a little extra with scroll
        angle += -2.4 * (1 - p) ** 3 + ((now - start) / 1000) * SPIN + window.scrollY * 0.0025;
      }
      if (angle !== lastAngle) {
        lastAngle = angle;
        draw(angle);
      }
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    const ro = new ResizeObserver(resize);
    const scheme = matchMedia("(prefers-color-scheme: dark)");

    readColor();
    resize();
    io.observe(canvas);
    ro.observe(canvas);
    scheme.addEventListener("change", readColor);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      scheme.removeEventListener("change", readColor);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
