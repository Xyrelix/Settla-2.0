"use client";

import React, { useState } from "react";

interface MorphItemProps {
  v1Title: string;
  v1Body: string;
  v2Title: string;
  v2Body: string;
}

export function MorphItem({ v1Title, v1Body, v2Title, v2Body }: MorphItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      aria-label={`${v1Title} — hover to see Settla 2.0 update`}
    >
      {/* V1 — fades + blurs out */}
      <div
        className="transition-all duration-500"
        style={{
          opacity: hovered ? 0 : 1,
          filter: hovered ? "blur(4px)" : "blur(0px)",
          transform: hovered ? "scale(0.97)" : "scale(1)",
          position: hovered ? "absolute" : "relative",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <dt className="font-semibold">{v1Title}</dt>
        <dd className="mt-1 text-muted">{v1Body}</dd>
      </div>

      {/* V2 — fades + unblurs in */}
      <div
        className="transition-all duration-500"
        style={{
          opacity: hovered ? 1 : 0,
          filter: hovered ? "blur(0px)" : "blur(4px)",
          transform: hovered ? "scale(1)" : "scale(0.97)",
          position: hovered ? "relative" : "absolute",
          inset: 0,
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <dt className="flex items-center gap-2 font-semibold" style={{ color: "var(--sub)" }}>
          {v2Title}
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-white"
            style={{ background: "var(--sub)" }}
          >
            2.0
          </span>
        </dt>
        <dd className="mt-1 text-muted">{v2Body}</dd>
      </div>
    </div>
  );
}
