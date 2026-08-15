"use client";

const NUMBERED_LINE = /^(\d+)\s*[-.)]\s*(.*)$/;

function parseLines(text: string) {
  return text.split("\n").map((line, index) => {
    const trimmed = line.trim();
    const numbered = trimmed.match(NUMBERED_LINE);
    if (numbered) {
      return { key: index, type: "item" as const, number: numbered[1]!, text: numbered[2]! };
    }
    if (!trimmed) return { key: index, type: "space" as const };
    return { key: index, type: "text" as const, text: line };
  });
}

export function ShowWelcomeMessage({ text }: { text: string }) {
  const lines = parseLines(text);
  const title = lines.find((line) => line.type === "text");

  return (
    <div className="space-y-2">
      {lines.map((line) => {
        if (line.type === "space") return <div key={line.key} className="h-1" />;

        if (line.type === "item") {
          return (
            <div key={line.key} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-tava-purple to-tava-neon-pink font-display text-xs font-black text-white shadow-sm">
                {line.number}
              </span>
              <p className="font-show pt-0.5 text-[1.05rem] leading-snug text-gray-800">{line.text}</p>
            </div>
          );
        }

        const isTitle = line.key === title?.key;
        return (
          <p
            key={line.key}
            className={
              isTitle
                ? "font-show bg-gradient-to-r from-tava-purple via-fuchsia-600 to-tava-neon-pink bg-clip-text text-2xl font-bold leading-tight text-transparent sm:text-3xl"
                : "font-show text-base leading-relaxed text-gray-700"
            }
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
