"use client";

/**
 * Feeds the cursor position to any `.spotlight` card inside, so its edge glow follows the
 * pointer. One listener for the whole grid; the glow itself is CSS (hover + fine pointer only).
 */
export function SpotlightGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={className}
      onPointerMove={(e) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".spotlight");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--x", `${e.clientX - r.left}px`);
        card.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
