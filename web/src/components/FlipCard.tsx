"use client";

import React, { useState } from "react";

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}

export function FlipCard({ front, back, className = "" }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`flip-root group ${className}`}
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={() => setFlipped(false)}
      tabIndex={0}
      role="group"
      aria-label="Hover to see Settla 2.0 update"
    >
      {/* Flip hint */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wider opacity-60 transition-opacity duration-200 group-hover:opacity-0"
        style={{ background: "var(--sub-soft)", color: "var(--sub)" }}
      >
        <span>↻</span> 2.0
      </div>

      {/* The flipping inner container */}
      <div
        className="flip-inner relative size-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT — v1 terracotta */}
        <div
          className="flip-face flip-front card spotlight flex h-full flex-col gap-6 p-7"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {front}
        </div>

        {/* BACK — v2 indigo */}
        <div
          className="flip-face flip-back flex h-full flex-col gap-6 p-7"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "var(--sub-soft)",
            borderRadius: "inherit",
            position: "absolute",
            inset: 0,
          }}
        >
          {/* 2.0 badge */}
          <div className="absolute right-4 top-4">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-white"
              style={{ background: "var(--sub)" }}
            >
              2.0
            </span>
          </div>
          {back}
        </div>
      </div>
    </div>
  );
}
