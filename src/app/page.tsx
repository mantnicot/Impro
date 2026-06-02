"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TheaterLights } from "@/components/TheaterLights";
import { TavaLogo } from "@/components/TavaLogo";
import { GameScreen } from "@/components/GameScreen";
import { QuickMenu } from "@/components/QuickMenu";
import { ListManager } from "@/components/ListManager";
import { FavoritesPanel } from "@/components/FavoritesPanel";
import { SettingsPanel, StatsPanel } from "@/components/SettingsPanel";
import {
  initStorage,
  getAllLists,
  getList,
  getRandomWords,
  getSettings,
  saveSettings,
} from "@/lib/storage";
import { unlockAudio } from "@/lib/sounds";
import {
  FAVORITES_LIST_ID,
  FAVORITES_LIST_NAME,
  RANDOM_LIST_ID,
  RANDOM_LIST_NAME,
} from "@/lib/default-words";
import type { WordList } from "@/types";

type Screen = "home" | "game";
type Panel = "menu" | "lists" | "favorites" | "settings" | "stats" | null;

interface ActiveGame {
  listName: string;
  words: string[];
  useAllWords: boolean;
}

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [lists, setLists] = useState<WordList[]>([]);
  const [screen, setScreen] = useState<Screen>("home");
  const [panel, setPanel] = useState<Panel>(null);
  const [game, setGame] = useState<ActiveGame | null>(null);
  const [settings, setSettingsState] = useState(getSettings());

  const refreshLists = useCallback(async () => {
    const all = await getAllLists();
    setLists(all);
  }, []);

  useEffect(() => {
    initStorage().then(() => {
      refreshLists();
      setReady(true);
    });
  }, [refreshLists]);

  const startRandom = () => {
    void unlockAudio();
    setGame({ listName: RANDOM_LIST_NAME, words: getRandomWords(100), useAllWords: false });
    setScreen("game");
  };

  const startList = async (list: WordList) => {
    const fresh = await getList(list.id);
    if (!fresh || fresh.words.length === 0) return;
    void unlockAudio();
    setGame({
      listName: fresh.name,
      words: [...fresh.words],
      useAllWords: true,
    });
    setScreen("game");
  };

  const favorites = lists.find((l) => l.id === FAVORITES_LIST_ID);

  const toggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    saveSettings(updated);
    setSettingsState(updated);
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-theater-gradient">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-16 w-16 rounded-full border-4 border-tava-purple/20 border-t-tava-purple"
        />
      </div>
    );
  }

  if (screen === "game" && game) {
    return (
      <>
        <GameScreen
          listName={game.listName}
          words={game.words}
          useAllWords={game.useAllWords}
          logoUrl={settings.logoUrl}
          soundEnabled={settings.soundEnabled}
          onMenu={() => setPanel("menu")}
          onExit={() => {
            setScreen("home");
            setGame(null);
          }}
          onFavoritesChanged={refreshLists}
        />
        <QuickMenu
          open={panel === "menu"}
          onClose={() => setPanel(null)}
          onFavorites={() => setPanel("favorites")}
          onLists={() => {
            setScreen("home");
            setPanel("lists");
          }}
          onSettings={() => setPanel("settings")}
          onStats={() => setPanel("stats")}
          soundEnabled={settings.soundEnabled}
          onToggleSound={toggleSound}
        />
        {panel === "favorites" && (
          <FavoritesPanel
            favorites={favorites}
            onRefresh={refreshLists}
            onClose={() => setPanel(null)}
            onPlay={() => {
              if (favorites && favorites.words.length > 0) {
                startList(favorites);
                setPanel(null);
              }
            }}
          />
        )}
        {panel === "settings" && <SettingsPanel onClose={() => setPanel(null)} />}
        {panel === "stats" && <StatsPanel onClose={() => setPanel(null)} />}
      </>
    );
  }

  const customLists = lists.filter((l) => l.id !== FAVORITES_LIST_ID);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-theater-gradient">
      <TheaterLights />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <TavaLogo size="md" logoUrl={settings.logoUrl} />
        <button
          onClick={() => setPanel("menu")}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:border-tava-purple hover:text-tava-purple"
        >
          ☰ Menú
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="font-display text-4xl font-black text-gray-800 sm:text-5xl">
            Object{" "}
            <span className="bg-gradient-to-r from-tava-purple to-tava-neon-pink bg-clip-text text-transparent">
              Roulette
            </span>
          </h1>
          <p className="mt-2 text-gray-500">Improvisación teatral · Grupo TAVA</p>
        </motion.div>

        <div className="grid w-full max-w-md gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startRandom}
            className="group relative overflow-hidden rounded-2xl border-2 border-tava-purple/30 bg-white p-6 text-left shadow-lg transition hover:border-tava-purple hover:shadow-xl"
          >
            <div className="absolute -right-4 -top-4 text-6xl opacity-10">🎲</div>
            <h2 className="font-display text-2xl font-bold text-tava-purple">Modo Aleatorio</h2>
            <p className="mt-1 text-sm text-gray-500">
              Palabras simples con foto del objeto solo
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPanel("lists")}
            className="group relative overflow-hidden rounded-2xl border-2 border-tava-neon-pink/30 bg-white p-6 text-left shadow-lg transition hover:border-tava-neon-pink"
          >
            <div className="absolute -right-4 -top-4 text-6xl opacity-10">📋</div>
            <h2 className="font-display text-2xl font-bold text-gray-800">Listas Personalizadas</h2>
            <p className="mt-1 text-sm text-gray-500">
              {customLists.length} lista{customLists.length !== 1 ? "s" : ""} creada
              {customLists.length !== 1 ? "s" : ""}
            </p>
          </motion.button>

          {favorites && favorites.words.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startList(favorites)}
              className="rounded-2xl border border-tava-neon-pink/40 bg-pink-50 p-4 text-center font-medium text-tava-neon-pink transition hover:bg-pink-100"
            >
              ★ Jugar Favoritos ({favorites.words.length})
            </motion.button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex gap-6 text-xs text-gray-400"
        >
          <span>→ Siguiente</span>
          <span>← Anterior</span>
          <span>↑ Favorito</span>
          <span>↓ Menú</span>
        </motion.div>
      </main>

      <QuickMenu
        open={panel === "menu"}
        onClose={() => setPanel(null)}
        onFavorites={() => setPanel("favorites")}
        onLists={() => setPanel("lists")}
        onSettings={() => setPanel("settings")}
        onStats={() => setPanel("stats")}
        soundEnabled={settings.soundEnabled}
        onToggleSound={toggleSound}
      />

      {panel === "lists" && (
        <ListManager
          lists={lists}
          onRefresh={refreshLists}
          onClose={() => setPanel(null)}
          onPlayList={(list) => {
            startList(list);
            setPanel(null);
          }}
        />
      )}
      {panel === "favorites" && (
        <FavoritesPanel
          favorites={favorites}
          onRefresh={refreshLists}
          onClose={() => setPanel(null)}
          onPlay={() => {
            if (favorites && favorites.words.length > 0) {
              startList(favorites);
              setPanel(null);
            }
          }}
        />
      )}
      {panel === "settings" && <SettingsPanel onClose={() => setPanel(null)} />}
      {panel === "stats" && <StatsPanel onClose={() => setPanel(null)} />}
    </div>
  );
}
