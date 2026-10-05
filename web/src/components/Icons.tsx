// Tabler icons (via better-icons). One outline set, recoloured with currentColor.
// Match `stroke` to the text beside it: 1.5 for regular, 1.75 for medium, 2 for semibold.

type IconProps = { className?: string; stroke?: number };

function Svg({ className = "size-4", stroke = 2, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export const ArrowUpRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 7 7 17M8 7h9v9" />
  </Svg>
);

export const ArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M5 12l6 6m-6-6 6-6" />
  </Svg>
);

export const Copy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z" />
    <path d="M4.012 16.737A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1" />
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12 5 5L20 7" />
  </Svg>
);
