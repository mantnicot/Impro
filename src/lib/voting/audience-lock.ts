/** El publico queda fuera al menos este tiempo. Admin y proyector siguen. */
export const AUDIENCE_LOCK_MS = 2 * 60 * 60 * 1000;

export function isAudienceClosed(until: string | null | undefined, now = Date.now()): boolean {
  if (!until) return false;
  const time = Date.parse(until);
  return Number.isFinite(time) && time > now;
}

export function formatAudienceLock(until: string): string {
  return new Date(until).toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  });
}
