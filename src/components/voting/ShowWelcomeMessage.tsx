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
    <div className="space-y-2.5">
      {lines.map((line) => {
        if (line.type === "space") return <div key={line.key} className="h-1" />;

        if (line.type === "item") {
          return (
            <div key={line.key} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tava-red font-display text-sm text-white shadow-[2px_2px_0_rgba(11,18,32,0.25)]">
                {line.number}
              </span>
              <p className="font-hand pt-0.5 text-xl leading-snug text-tava-blue">{line.text}</p>
            </div>
          );
        }

        const isTitle = line.key === title?.key;
        return (
          <p
            key={line.key}
            className={
              isTitle
                ? "font-display text-3xl leading-none tracking-wide text-tava-blue sm:text-4xl"
                : "font-hand text-xl leading-snug text-gray-700"
            }
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
