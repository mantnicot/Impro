"use client";

export function TavaWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-1/2 h-[min(85vw,85vh)] w-[min(85vw,85vh)] -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat opacity-[0.04]"
        style={{ backgroundImage: "url(/icons/tava-logo.png)" }}
      />
    </div>
  );
}
