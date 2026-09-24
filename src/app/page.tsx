"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TheaterLights } from "@/components/TheaterLights";
import { ShowBrandTitle } from "@/components/ShowBrandTitle";
import { GameScreen } from "@/components/GameScreen";
import { QuickMenu } from "@/components/QuickMenu";
import { ListManager } from "@/components/ListManager";
import { FavoritesPanel } from "@/components/FavoritesPanel";
import { SettingsPanel, StatsPanel } from "@/components/SettingsPanel";
import { MainModuleNav, type AppModule } from "@/components/MainModuleNav";
import { ImproColombiaModule } from "@/components/ImproColombiaModule";
import { PremisesModule } from "@/components/PremisesModule";
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
    subtitle: "#TAVA en el acto · Ruleta de objetos",
  },
  scenes: {
    title: "Crear escenas",
    subtitle: "Lugares, personajes y características",
  },
  premises: {
    title: "Premisas chistosas",
    subtitle: "Tarjetas para improvisar en grupo",
  },
  voting: {
    title: "Votación de artistas",
    subtitle: "#TAVA en el acto · Sala y resultados",
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
          className="h-16 w-16 rounded-full border-4 border-tava-yellow/30 border-t-tava-yellow"
        />
      </div>
    );
  }

  if (!role) {
    return <JoinScreen onJoined={handleJoined} />;
  }

  if (role === "participant") {
    return (
      <div className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-theater-gradient">
        <TheaterLights />
        <header className="relative z-10 flex shrink-0 items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <ShowBrandTitle size="sm" light className="items-start" />
          <button
            type="button"
            onClick={() => {
              clearSession();
              setRoleState(null);
            }}
            className="shrink-0 rounded-xl border-2 border-tava-yellow bg-tava-yellow px-3 py-1.5 text-xs font-black text-tava-blue"
          >
            Salir
          </button>
        </header>
        <main className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
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
      </>
    );
  }

  const customLists = lists.filter((l) => l.id !== FAVORITES_LIST_ID);
  const { title, subtitle } = MODULE_COPY[module];

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-theater-gradient pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <TheaterLights />

      <header className="relative z-10 flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <ShowBrandTitle size="sm" light className="items-start" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              clearSession();
              setRoleState(null);
            }}
            className="rounded-xl border-2 border-white/30 bg-white/10 px-2 py-2 text-xs font-bold text-white"
          >
            Salir
          </button>
          <button
            type="button"
            onClick={() => setPanel("menu")}
            className="rounded-xl border-2 border-tava-yellow bg-tava-yellow px-3 py-2 text-sm font-black text-tava-blue shadow-sm"
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
          className={`shrink-0 px-4 pb-2 text-center sm:px-6 ${module === "voting" ? "hidden sm:block" : ""}`}
        >
          <h1 className="font-display text-3xl tracking-wide text-tava-yellow sm:text-4xl">
            {module === "words" ? "OBJECT ROULETTE" : title.toUpperCase()}
          </h1>
          <p className="font-hand text-lg text-white/80 sm:text-xl">{subtitle}</p>
        </motion.div>

        {module === "words" && (
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 pb-2">
            <div className="grid w-full max-w-md gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startRandom}
                className="group relative overflow-hidden rounded-2xl border-4 border-tava-yellow bg-white p-6 text-left shadow-[6px_6px_0_rgba(11,18,32,0.35)]"
              >
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">🎲</div>
                <h2 className="font-display text-3xl tracking-wide text-tava-blue">MODO ALEATORIO</h2>
                <p className="mt-1 font-hand text-lg text-gray-600">Palabras con foto del objeto</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPanel("lists")}
                className="group relative overflow-hidden rounded-2xl border-4 border-white bg-tava-red p-6 text-left shadow-[6px_6px_0_rgba(11,18,32,0.35)]"
              >
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">📋</div>
                <h2 className="font-display text-3xl tracking-wide text-white">LISTAS</h2>
                <p className="mt-1 font-hand text-lg text-yellow-100">
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

            <p className="mt-6 font-hand text-lg text-tava-yellow/90">
              Arrastra la tarjeta o usa los botones · → Siguiente · ← Anterior · ★ Favorito
            </p>
          </div>
        )}

        {module === "scenes" && <ImproColombiaModule />}
        {module === "premises" && <PremisesModule />}
        {module === "voting" && <VotingAdminPanel />}
      </main>

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
      {module !== "voting" && <ControlDock aboveNav />}
    </div>
  );
}
