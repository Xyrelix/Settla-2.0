"use client";

import React, { useRef, useState, useCallback } from "react";

interface SliderCardProps {
  front: React.ReactNode;   // v1 — left side, terracotta
  back: React.ReactNode;    // v2 — right side, indigo
  className?: string;
}

export function SliderCard({ front, back, className = "" }: SliderCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Start at 55% so v1 is dominant at rest; 2.0 peeks from the right
  const [pct, setPct] = useState(55);
  const dragging = useRef(false);

  const calcPct = useCallback((clientX: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const raw = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.min(92, Math.max(8, raw)));
  }, []);

  // Mouse
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    calcPct(e.clientX);
  }, [calcPct]);

  const onMouseLeave = useCallback(() => {
    dragging.current = false;
    setPct(55); // snap back to rest
  }, []);

  // Touch
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    calcPct(e.touches[0].clientX);
  }, [calcPct]);

  const onTouchEnd = useCallback(() => {
    setPct(55);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden rounded-[1.25rem] select-none cursor-col-resize ${className}`}
      style={{ touchAction: "none" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-label="Slide to compare Settla v1 and Settla 2.0"
      role="img"
    >
      {/* ── V1 LAYER (full width, clipped on right) ── */}
      <div
        className="card spotlight flex flex-col gap-6 p-7"
        style={{
          clipPath: `inset(0 ${100 - pct}% 0 0)`,
          transition: dragging.current ? "none" : "clip-path 0.08s ease-out",
          position: "absolute",
          inset: 0,
        }}
      >
        {front}
      </div>

      {/* ── V2 LAYER (full width, clipped on left) ── */}
      <div
        className="flex flex-col gap-6 p-7"
        style={{
          clipPath: `inset(0 0 0 ${pct}%)`,
          transition: dragging.current ? "none" : "clip-path 0.08s ease-out",
          background: "var(--sub-soft)",
          position: "absolute",
          inset: 0,
        }}
      >
        {/* 2.0 badge */}
        <div className="absolute right-4 top-4 z-10">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-white"
            style={{ background: "var(--sub)" }}
          >
            2.0
          </span>
        </div>
        {back}
      </div>

      {/* ── SPACER (invisible, sets card height) ── */}
      <div className="invisible flex flex-col gap-6 p-7" aria-hidden>
        {front}
      </div>

      {/* ── DIVIDER HANDLE ── */}
      <div
        className="pointer-events-none absolute inset-y-0 z-10 flex items-center"
        style={{
          left: `${pct}%`,
          transform: "translateX(-50%)",
          transition: dragging.current ? "none" : "left 0.08s ease-out",
        }}
      >
        <div
          className="h-full w-0.5 opacity-70"
          style={{ background: "var(--sub)" }}
        />
        <div
          className="absolute grid size-8 place-items-center rounded-full shadow-md"
          style={{ background: "var(--sub)", color: "#fff" }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M1 5h12M4 2L1 5l3 3M10 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── HOVER HINT (fades once moved) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-white transition-opacity duration-300"
        style={{
          background: "var(--sub)",
          opacity: pct === 55 ? 0.75 : 0,
        }}
      >
        ← slide to reveal 2.0 →
      </div>
    </div>
  );
}
