type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { box: string; text: string; stroke: string }> = {
  sm: { box: "w-9 h-9", text: "text-[11px]", stroke: "0.6" },
  md: { box: "w-11 h-11", text: "text-[12px]", stroke: "0.55" },
  lg: { box: "w-20 h-20", text: "text-[20px]", stroke: "0.5" },
};

export default function Logo({
  size = "md",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span
      className={`relative inline-flex items-center justify-center ${s.box} ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r="19.3"
          fill="none"
          stroke="currentColor"
          strokeWidth={s.stroke}
        />
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth={s.stroke}
        />
      </svg>
      <span
        className={`relative font-serif font-light tracking-[0.18em] leading-none ${s.text} translate-y-[0.5px]`}
      >
        SH
      </span>
    </span>
  );
}
