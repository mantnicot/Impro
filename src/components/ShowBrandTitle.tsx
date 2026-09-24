"use client";

interface ShowBrandTitleProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  light?: boolean;
}

const sizeMap = {
  sm: { tava: "text-2xl sm:text-3xl", acto: "text-xs sm:text-sm", gap: "gap-1" },
  md: { tava: "text-4xl sm:text-5xl", acto: "text-sm sm:text-base", gap: "gap-1.5" },
  lg: { tava: "text-6xl sm:text-7xl", acto: "text-lg sm:text-xl", gap: "gap-2" },
};

export function ShowBrandTitle({ size = "md", className = "", light = false }: ShowBrandTitleProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex flex-col items-center ${s.gap} ${className}`}>
      <p
        className={`font-display leading-none tracking-[0.04em] text-shadow-poster ${s.tava} ${
          light ? "text-tava-yellow" : "text-tava-blue"
        }`}
      >
        #TAVA
      </p>
      <span
        className={`-rotate-1 bg-tava-red px-3 py-0.5 font-display uppercase tracking-[0.18em] text-white shadow-[3px_3px_0_rgba(11,18,32,0.35)] ${s.acto}`}
      >
        en el acto
      </span>
    </div>
  );
}
