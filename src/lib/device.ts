/** Dispositivos táctiles (móvil/tablet) donde el audio de YouTube es más restrictivo. */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}
