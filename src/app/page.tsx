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
import { MainModuleNav, type AppModule } from "@/components/MainModuleNav";
import { ImproColombiaModule } from "@/components/ImproColombiaModule";
import { AmbienceModule } from "@/components/AmbienceModule";
import { PremisesModule } from "@/components/PremisesModule";
import { AmbienceMiniBar } from "@/components/AmbienceMiniBar";
import { ControlDock } from "@/components/ControlDock";
import { JoinScreen } from "@/components/JoinScreen";
import { VotingAdminPanel } from "@/components/voting/VotingAdminPanel";
import { VotingParticipantView } from "@/components/voting/VotingParticipantView";
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
  RANDOM_LIST_NAME,
} from "@/lib/default-words";
import { clearSession, getRole, type UserRole } from "@/lib/role-storage";
import type { WordList } from "@/types";

type Screen = "hub" | "game";
type Panel = "menu" | "lists" | "favorites" | "settings" | "stats" | null;

interface ActiveGame {
  listName: string;
  words: string[];
  useAllWords: boolean;
}

const MODULE_COPY: Record<AppModule, { title: string; subtitle: string }> = {
  words: {
    title: "Palabras aleatorias",
    subtitle: "Ruleta de objetos · Grupo TAVA",
  },
  scenes: {
    title: "Crear escenas",
    subtitle: "Lugares, personajes y características",
  },
  ambiences: {
    title: "Ambientes musicales",
    subtitle: "Géneros con enlaces de YouTube",
  },
  premises: {
    title: "Premisas chistosas",
    subtitle: "Tarjetas para improvisar en grupo",
  },
  voting: {
    title: "Votación de artistas",
    subtitle: "Administra la sala y publica resultados",
  },
};

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [role, setRoleState] = useState<UserRole>(null);
  const [lists, setLists] = useState<WordList[]>([]);
  const [screen, setScreen] = useState<Screen>("hub");
  const [module, setModule] = useState<AppModule>("words");
  const [panel, setPanel] = useState<Panel>(null);
  const [game, setGame] = useState<ActiveGame | null>(null);
  const [settings, setSettingsState] = useState(getSettings());

  const refreshLists = useCallback(async () => {
    const all = await getAllLists();
    setLists(all);
  }, []);

  useEffect(() => {
    setRoleState(getRole());
    initStorage().then(() => {
      refreshLists();
      setReady(true);
    });
  }, [refreshLists]);

  const handleJoined = (r: UserRole) => {
    setRoleState(r);
  };

  const startRandom = () => {
    void unlockAudio();
    setGame({ listName: RANDOM_LIST_NAME, words: getRandomWords(), useAllWords: false });
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
      <div className="flex h-[100dvh] items-center justify-center bg-theater-gradient">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-16 w-16 rounded-full border-4 border-tava-purple/20 border-t-tava-purple"
        />
      </div>
    );
  }

  if (!role) {
    return <JoinScreen onJoined={handleJoined} />;
  }

  if (role === "participant") {
    return (
      <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-theater-gradient">
        <TheaterLights />
        <header className="relative z-10 shrink-0 px-4 py-4 text-center">
          <TavaLogo size="sm" logoUrl={settings.logoUrl} />
          <h1 className="mt-2 font-display text-xl font-black text-gray-800">Votación TAVA</h1>
        </header>
        <main className="relative z-10 min-h-0 flex-1 overflow-hidden">
          <VotingParticipantView />
        </main>
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
          showControls
          onMenu={() => setPanel("menu")}
          onExit={() => {
            setScreen("hub");
            setGame(null);
          }}
          onFavoritesChanged={refreshLists}
        />
        <QuickMenu
          open={panel === "menu"}
          onClose={() => setPanel(null)}
          onFavorites={() => setPanel("favorites")}
          onLists={() => {
            setScreen("hub");
            setModule("words");
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
        <AmbienceMiniBar />
      </>
    );
  }

  const customLists = lists.filter((l) => l.id !== FAVORITES_LIST_ID);
  const { title, subtitle } = MODULE_COPY[module];

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-theater-gradient pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <TheaterLights />

      <header className="relative z-10 flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <TavaLogo size="md" logoUrl={settings.logoUrl} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              clearSession();
              setRoleState(null);
            }}
            className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs text-gray-500"
          >
            Salir
          </button>
          <button
            type="button"
            onClick={() => setPanel("menu")}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition hover:border-tava-purple hover:text-tava-purple"
          >
            ☰ Menú
          </button>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]">
        <motion.div
          key={module}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 px-4 pb-2 text-center sm:px-6"
        >
          <h1 className="font-display text-2xl font-black text-gray-800 sm:text-3xl">
            {module === "words" ? (
              <>
                Object{" "}
                <span className="bg-gradient-to-r from-tava-purple to-tava-neon-pink bg-clip-text text-transparent">
                  Roulette
                </span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-tava-purple to-tava-neon-pink bg-clip-text text-transparent">
                {title}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 sm:text-sm">{subtitle}</p>
        </motion.div>

        {module === "words" && (
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 pb-2">
            <div className="grid w-full max-w-md gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startRandom}
                className="group relative overflow-hidden rounded-2xl border-2 border-tava-purple/30 bg-white p-6 text-left shadow-lg transition hover:border-tava-purple"
              >
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">🎲</div>
                <h2 className="font-display text-2xl font-bold text-tava-purple">Modo Aleatorio</h2>
                <p className="mt-1 text-sm text-gray-500">Palabras con foto del objeto</p>
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
                  {customLists.length} lista{customLists.length !== 1 ? "s" : ""}
                </p>
              </motion.button>

              {favorites && favorites.words.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startList(favorites)}
                  className="rounded-2xl border border-tava-neon-pink/40 bg-pink-50 p-4 text-center font-medium text-tava-neon-pink"
                >
                  ★ Favoritos ({favorites.words.length})
                </motion.button>
              )}
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Arrastra la tarjeta o usa los botones del dock · → Siguiente · ← Anterior · ★ Favorito
            </p>
          </div>
        )}

        {module === "scenes" && <ImproColombiaModule />}
        {module === "premises" && <PremisesModule />}
        {module === "ambiences" && <AmbienceModule />}
        {module === "voting" && <VotingAdminPanel />}
      </main>

      <AmbienceMiniBar hidden={module === "ambiences"} />
      <MainModuleNav active={module} onChange={setModule} />

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
      <ControlDock aboveNav />
    </div>
  );
}
