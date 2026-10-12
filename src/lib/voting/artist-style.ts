export type AvatarGender = "male" | "female";

/** Paleta TAVA + acentos del álbum (fondo de carta completo). */
export const ARTIST_COLORS = [
  "#1A3A82", // azul TAVA
  "#D61A21", // rojo TAVA
  "#FFC600", // amarillo TAVA
  "#0B6E4F", // verde escena
  "#E85D04", // naranja Panini
  "#6D28D9", // violeta
  "#0891B2", // cian
  "#BE185D", // rosa show
  "#334155", // pizarra
  "#15803D", // verde vivo
];

export const ARTIST_TAGLINES = [
  "El mas chistoso",
  "La mas entretenida",
  "El de las ideas raras",
  "La reina del remate",
  "El que nunca falla",
  "La energia del grupo",
  "El caos elegante",
  "La sorpresa de la noche",
  "El que prende la escena",
  "La que roba miradas",
  "El experto en improvisar",
  "La sonrisa peligrosa",
];

export function normalizeArtistColor(color?: string): string {
  if (!color) return ARTIST_COLORS[0]!;
  return ARTIST_COLORS.includes(color) ? color : ARTIST_COLORS[0]!;
}

export function normalizeAvatarGender(value?: string): AvatarGender {
  return value === "female" ? "female" : "male";
}

export function pickDefaultTagline(index = 0): string {
  return ARTIST_TAGLINES[index % ARTIST_TAGLINES.length]!;
}

export function normalizeTagline(value: string | undefined, fallbackIndex = 0): string {
  const trimmed = value?.trim().slice(0, 48);
  return trimmed || pickDefaultTagline(fallbackIndex);
}

/** Texto claro u oscuro según el fondo de la carta. */
export function contrastOnColor(hex: string): "#FFFFFF" | "#0B1220" {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return "#FFFFFF";
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#0B1220" : "#FFFFFF";
}
