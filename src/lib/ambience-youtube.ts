/**
 * Pistas de YouTube: sonidos de naturaleza, ambientes y música royalty-free/CC.
 * Evitamos hits populares (lofi girl, canciones de radio, etc.).
 */
export interface YoutubeAmbienceSource {
  videoId: string;
  /** Segundo de inicio (útil en compilaciones largas) */
  startSeconds?: number;
  credit?: string;
}

export const YOUTUBE_AMBIENCE: Record<string, YoutubeAmbienceSource> = {
  // Romántico — piano suave CC + lluvia/naturaleza
  "piano-rom": {
    videoId: "8-Fmt4I_Sng",
    credit: "Scott Buckley — Resolutions (CC-BY)",
  },
  balada: {
    videoId: "8plwv25NYRo",
    credit: "Relaxing Sounds Of Nature — lluvia en bosque",
  },
  enamoramiento: {
    videoId: "q76bMs-NwRk",
    credit: "The Relaxed Guy — lluvia nocturna suave",
  },

  // Acción — orquestal royalty-free (Scott Buckley CC)
  epica: { videoId: "jdgiQeHnHbY", credit: "Scott Buckley — Ignis (CC-BY)" },
  persecucion: { videoId: "V1S1IfoX8Yg", credit: "Scott Buckley — Discovery (CC-BY)" },
  batalla: { videoId: "jdgiQeHnHbY", startSeconds: 45, credit: "Scott Buckley — Ignis" },

  // Fantasía — bosque, naturaleza, ambientación épica suave
  bosque: { videoId: "dAGt8wSPnlQ", credit: "Streaming Birds — arroyo del bosque" },
  aventura: { videoId: "1wn-OSiNVjE", credit: "Streaming Birds — cantos de aves" },
  reino: { videoId: "zmCgf2dnf60", credit: "Scott Buckley — Memories of Stone (CC-BY)" },

  // Terror — drones oscuros y ambientes de horror libres
  suspenso: { videoId: "L1gE_jLEsNU", credit: "Shrouded In Silence — dark ambient" },
  embrujada: { videoId: "xAO3x-Uhfoo", credit: "ESN Productions — horror free" },
  horror: { videoId: "GNEpUSjYAjI", credit: "Cryo Chamber — dark ambient" },

  // Comedia — compilación royalty-free (Fesliyan Studios)
  divertida: { videoId: "XbOkPxriS6s", startSeconds: 4, credit: "Fesliyan Studios — comedia RF" },
  absurda: { videoId: "XbOkPxriS6s", startSeconds: 1235, credit: "Fesliyan Studios — comedia RF" },
  circo: { videoId: "XbOkPxriS6s", startSeconds: 360, credit: "Fesliyan Studios — comedia RF" },

  // Misterio — lluvia + ciudad de noche (sin música famosa)
  detective: { videoId: "Yd1Y68Zc3_0", credit: "CalmNest — lluvia y luces urbanas" },
  investigacion: { videoId: "q76bMs-NwRk", credit: "The Relaxed Guy — lluvia nocturna" },
  espionaje: { videoId: "-rV2YMVKAtk", credit: "Rain Night City — lluvia NYC" },

  // Drama — lluvia y cuerdas melancólicas CC
  tristeza: { videoId: "jX6kn9_U8qk", credit: "MeditationRelaxClub — lluvia" },
  reflexion: { videoId: "eKFTSSKCzWA", credit: "Natural calm forest sounds" },
  melancolia: { videoId: "zmCgf2dnf60", credit: "Scott Buckley — Memories of Stone" },

  // Tensión — reloj, drones
  cuenta: { videoId: "xyCQFLOSWGc", credit: "Ambience Nouveau — reloj" },
  decision: { videoId: "xAO3x-Uhfoo", credit: "ESN Productions — ominoso" },
  riesgo: { videoId: "Ottoina_jPA", credit: "Veduora — post-apocalíptico" },
};

/** Fondos visuales (mismo audio de YouTube, video visible en modo B) */
export const YOUTUBE_VISUAL_SCENES: Record<string, YoutubeAmbienceSource> = {
  lluvia: { videoId: "8plwv25NYRo" },
  ciudad: { videoId: "Yd1Y68Zc3_0" },
  bosque: { videoId: "dAGt8wSPnlQ" },
  espacio: { videoId: "L1gE_jLEsNU" },
  mar: { videoId: "WHPEKLQID4U" },
};

export function getYoutubeSource(trackId: string): YoutubeAmbienceSource | null {
  return YOUTUBE_AMBIENCE[trackId] ?? null;
}
