export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function shuffledCopy<T>(items: T[]): T[] {
  return shuffleInPlace([...items]);
}

/** Baraja evitando que los primeros resultados repitan palabras recientes. */
export function shuffleAvoidingRecent(all: string[], recent: string[], minSize?: number): string[] {
  const recentSet = new Set(recent.map((w) => w.trim().toLowerCase()));
  const fresh = all.filter((w) => !recentSet.has(w.trim().toLowerCase()));
  const stale = all.filter((w) => recentSet.has(w.trim().toLowerCase()));

  const deck = [...shuffleInPlace(fresh), ...shuffleInPlace(stale)];
  const target = minSize ?? all.length;
  if (deck.length >= target) return deck.slice(0, target);
  return shuffleInPlace([...deck, ...shuffleInPlace(all.filter((w) => !deck.includes(w)))].slice(0, target));
}
