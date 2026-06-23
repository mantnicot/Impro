export type AmbienceCategoryId =
  | "romantico"
  | "accion"
  | "fantasia"
  | "terror"
  | "comedia"
  | "misterio"
  | "drama"
  | "tension";

export interface AmbienceTrack {
  id: string;
  name: string;
}

export interface AmbienceCategory {
  id: AmbienceCategoryId;
  label: string;
  emoji: string;
  tracks: AmbienceTrack[];
  theme: {
    bg: string;
    glow: string;
    particle: string;
  };
}

export const AMBIENCE_CATEGORIES: AmbienceCategory[] = [
  {
    id: "romantico",
    label: "Romántico",
    emoji: "❤️",
    tracks: [
      { id: "piano-rom", name: "Piano romántico" },
      { id: "balada", name: "Balada instrumental" },
      { id: "enamoramiento", name: "Música de enamoramiento" },
    ],
    theme: { bg: "from-rose-100 via-amber-50 to-pink-100", glow: "rgba(244,63,94,0.35)", particle: "bg-rose-300" },
  },
  {
    id: "accion",
    label: "Acción",
    emoji: "⚔️",
    tracks: [
      { id: "epica", name: "Música épica" },
      { id: "persecucion", name: "Persecución" },
      { id: "batalla", name: "Batalla" },
    ],
    theme: { bg: "from-orange-100 via-red-50 to-amber-100", glow: "rgba(249,115,22,0.4)", particle: "bg-orange-400" },
  },
  {
    id: "fantasia",
    label: "Fantasía",
    emoji: "🧙",
    tracks: [
      { id: "bosque", name: "Bosque mágico" },
      { id: "aventura", name: "Aventura fantástica" },
      { id: "reino", name: "Reino encantado" },
    ],
    theme: { bg: "from-violet-200 via-purple-100 to-indigo-100", glow: "rgba(139,92,246,0.45)", particle: "bg-violet-300" },
  },
  {
    id: "terror",
    label: "Terror",
    emoji: "😱",
    tracks: [
      { id: "suspenso", name: "Suspenso" },
      { id: "embrujada", name: "Casa embrujada" },
      { id: "horror", name: "Horror psicológico" },
    ],
    theme: { bg: "from-gray-900 via-red-950 to-black", glow: "rgba(220,38,38,0.5)", particle: "bg-red-500" },
  },
  {
    id: "comedia",
    label: "Comedia",
    emoji: "😂",
    tracks: [
      { id: "divertida", name: "Música divertida" },
      { id: "absurda", name: "Situaciones absurdas" },
      { id: "circo", name: "Circo" },
    ],
    theme: { bg: "from-yellow-100 via-lime-50 to-amber-100", glow: "rgba(234,179,8,0.4)", particle: "bg-yellow-300" },
  },
  {
    id: "misterio",
    label: "Misterio",
    emoji: "🕵",
    tracks: [
      { id: "detective", name: "Detective" },
      { id: "investigacion", name: "Investigación" },
      { id: "espionaje", name: "Espionaje" },
    ],
    theme: { bg: "from-slate-300 via-gray-200 to-zinc-300", glow: "rgba(71,85,105,0.45)", particle: "bg-slate-400" },
  },
  {
    id: "drama",
    label: "Drama",
    emoji: "🌧",
    tracks: [
      { id: "tristeza", name: "Tristeza" },
      { id: "reflexion", name: "Reflexión" },
      { id: "melancolia", name: "Melancolía" },
    ],
    theme: { bg: "from-blue-200 via-slate-200 to-gray-300", glow: "rgba(59,130,246,0.35)", particle: "bg-blue-300" },
  },
  {
    id: "tension",
    label: "Tensión",
    emoji: "🔥",
    tracks: [
      { id: "cuenta", name: "Cuenta regresiva" },
      { id: "decision", name: "Decisión crítica" },
      { id: "riesgo", name: "Riesgo" },
    ],
    theme: { bg: "from-red-200 via-orange-100 to-amber-200", glow: "rgba(239,68,68,0.45)", particle: "bg-red-400" },
  },
];

export function getCategory(id: AmbienceCategoryId): AmbienceCategory {
  return AMBIENCE_CATEGORIES.find((c) => c.id === id)!;
}

export function getRandomTrack(categoryId: AmbienceCategoryId): {
  category: AmbienceCategory;
  track: AmbienceTrack;
} {
  const category = getCategory(categoryId);
  const track = category.tracks[Math.floor(Math.random() * category.tracks.length)];
  return { category, track };
}

export function pickRandomAmbience() {
  const cat = AMBIENCE_CATEGORIES[Math.floor(Math.random() * AMBIENCE_CATEGORIES.length)];
  return getRandomTrack(cat.id);
}
