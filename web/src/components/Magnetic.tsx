"use client";
import { useRef } from "react";

const MAX = 8; // px the button can drift toward the cursor
const clamp = (n: number) => Math.max(-MAX, Math.min(MAX, n));

/**
 * Lets a button lean toward a nearby cursor. The padded wrapper widens the pull area
 * without changing layout. Mouse/trackpad only, and off under reduced motion.
 */
export function Magnetic({ children }: { children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);

  return (
    <div
      className="-m-4 inline-block p-4"
      onPointerMove={(e) => {
        const el = inner.current;
        if (!el || !matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
          return;
        }
        const r = el.getBoundingClientRect();
        el.style.translate = `${clamp((e.clientX - (r.left + r.width / 2)) * 0.2)}px ${clamp((e.clientY - (r.top + r.height / 2)) * 0.3)}px`;
      }}
      onPointerLeave={() => {
        if (inner.current) inner.current.style.translate = "";
      }}
    >
      <div ref={inner} className="magnetic">
        {children}
      </div>
    </div>
  );
}
