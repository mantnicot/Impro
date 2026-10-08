export function parseGamesFromPaste(raw: string): { name: string; description: string }[] {
  const text = raw.trim();
  if (!text) return [];

  return text
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const sep = chunk.includes("::") ? "::" : chunk.includes(":") ? ":" : null;
      if (!sep) {
        return { name: chunk.replace(/\s+/g, " ").slice(0, 80), description: "" };
      }
      const [title, ...rest] = chunk.split(sep);
      return {
        name: (title ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
        description: rest.join(sep).trim().replace(/\s+/g, " ").slice(0, 240),
      };
    })
    .filter((game) => game.name.length > 0);
}

export function clampGameIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(Math.floor(index), total - 1));
}
