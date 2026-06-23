export interface AmbienceGenre {
  id: string;
  label: string;
  emoji: string;
  youtubeUrl: string;
}

/** v2: al cambiar predeterminados en código, subir versión para no mezclar caché vieja */
export const AMBIENCE_GENRES_STORAGE_KEY = "tava-ambience-genres-v2";

export const DEFAULT_AMBIENCE_GENRES: AmbienceGenre[] = [
  {
    id: "romance",
    label: "Romance",
    emoji: "❤️",
    youtubeUrl: "https://www.youtube.com/watch?v=2rn-vMbFglI&list=RD2rn-vMbFglI&start_radio=1",
  },
  {
    id: "accion",
    label: "Acción",
    emoji: "⚔️",
    youtubeUrl: "https://www.youtube.com/watch?v=XAYhNHhxN0A&list=RDXAYhNHhxN0A&start_radio=1",
  },
  {
    id: "piratas",
    label: "Piratas",
    emoji: "🏴‍☠️",
    youtubeUrl: "https://www.youtube.com/watch?v=fp0zwdlD0fY&list=RDfp0zwdlD0fY&start_radio=1",
  },
  {
    id: "miedo",
    label: "Miedo",
    emoji: "😱",
    youtubeUrl: "https://www.youtube.com/watch?v=Me-VhC9ieh0&list=RDMe-VhC9ieh0&start_radio=1",
  },
  {
    id: "ciencia-ficcion",
    label: "Ciencia ficción",
    emoji: "🚀",
    youtubeUrl: "https://www.youtube.com/watch?v=GLjDv_gx-_s",
  },
  {
    id: "fantasia",
    label: "Fantasía",
    emoji: "🧙",
    youtubeUrl: "https://www.youtube.com/watch?v=KSM9DwwY0DE&list=RDKSM9DwwY0DE&start_radio=1",
  },
  {
    id: "sexy",
    label: "Sexy",
    emoji: "💋",
    youtubeUrl: "https://www.youtube.com/watch?v=izGwDsrQ1eQ&list=RDizGwDsrQ1eQ&start_radio=1",
  },
  {
    id: "comica",
    label: "Cómica",
    emoji: "😂",
    youtubeUrl: "https://www.youtube.com/watch?v=XE4OOYpnoIU&list=RDXE4OOYpnoIU&start_radio=1",
  },
  {
    id: "documental",
    label: "Documental",
    emoji: "📽️",
    youtubeUrl: "https://www.youtube.com/watch?v=6j0PA_iNYQQ&list=PLSkabdIyCLRyo6GP6YisqUPz4MuIgXUxw",
  },
  {
    id: "musical-cabaret",
    label: "Musical cabaret",
    emoji: "🎪",
    youtubeUrl:
      "https://www.youtube.com/watch?v=RQa7SvVCdZk&list=RDRQa7SvVCdZk&start_radio=1&pp=ygUJbWVybWVsYWlkoAcB",
  },
  {
    id: "musical-normal",
    label: "Musical normal",
    emoji: "🎭",
    youtubeUrl: "https://www.youtube.com/watch?v=zCSjWrW0Fos&list=RDzCSjWrW0Fos&start_radio=1",
  },
  {
    id: "koreana-asiatica",
    label: "Koreana / Asiática",
    emoji: "🇰🇷",
    youtubeUrl: "https://www.youtube.com/watch?v=eqfWZqm3S_I&list=PL0nMnd5rzLJ3wq_YUMOxEyEvWEMe6IjuU",
  },
  {
    id: "motivacional",
    label: "Motivacional",
    emoji: "🔥",
    youtubeUrl: "https://www.youtube.com/watch?v=btPJPFnesV4&list=RDbtPJPFnesV4&start_radio=1",
  },
  {
    id: "dramatica",
    label: "Dramática",
    emoji: "🌧",
    youtubeUrl: "https://www.youtube.com/watch?v=taAxpw03dgM&list=PL-xVUW9dZgbccK7sPJI0JOxJ3LKTw5bZH",
  },
  {
    id: "infantil",
    label: "Infantil",
    emoji: "🧸",
    youtubeUrl: "https://www.youtube.com/watch?v=SE1yT2Y-1VA&list=RDSE1yT2Y-1VA&start_radio=1",
  },
];

export function parseYoutubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const v = u.searchParams.get("v");
    if (v) return v;
    const short = u.pathname.match(/^\/(shorts|embed)\/([^/?]+)/);
    if (short) return short[2];
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  }
  return null;
}

export function genreTheme(genreId: string) {
  const dark = ["miedo", "piratas", "ciencia-ficcion"].includes(genreId);
  const warm = ["romance", "sexy", "musical-cabaret", "musical-normal"].includes(genreId);
  const fun = ["comica", "infantil", "motivacional"].includes(genreId);

  if (dark) {
    return {
      bg: "from-gray-900 via-slate-900 to-black",
      glow: "rgba(30,30,30,0.6)",
      isDark: true,
    };
  }
  if (warm) {
    return {
      bg: "from-rose-100 via-amber-50 to-pink-100",
      glow: "rgba(244,63,94,0.3)",
      isDark: false,
    };
  }
  if (fun) {
    return {
      bg: "from-yellow-100 via-lime-50 to-amber-100",
      glow: "rgba(234,179,8,0.35)",
      isDark: false,
    };
  }
  return {
    bg: "from-violet-100 via-purple-50 to-indigo-100",
    glow: "rgba(124,58,237,0.3)",
    isDark: false,
  };
}
