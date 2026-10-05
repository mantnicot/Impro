export function normalizeAuthorName(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
}

/** Guarda en object_name: `"frase" por Autor` (sin columna extra). */
export function formatSubmissionDisplay(text: string, author?: string | null): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const who = normalizeAuthorName(author);
  if (!who) return trimmed;
  return `"${trimmed}" por ${who}`;
}
