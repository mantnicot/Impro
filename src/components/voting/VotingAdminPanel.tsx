"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getAdminPin, getSessionCode } from "@/lib/role-storage";
import { DEFAULT_PARTICIPANT_MESSAGE } from "@/lib/voting/default-participant-message";
import {
  ARTIST_COLORS,
  ARTIST_TAGLINES,
  type AvatarGender,
} from "@/lib/voting/artist-style";
import type { Artist, ArtistResult, DailyGame, VotingSession, VotingSummary } from "@/lib/voting/types";
import { ArtistIdentityCard } from "./ArtistIdentityCard";
import { LiveScoreboard } from "./LiveScoreboard";
import { VotingResults } from "./VotingResults";
import { WordRoulette } from "./WordRoulette";

type AdminStep = "sala" | "show" | "jugadores";

const STEPS: { id: AdminStep; number: string; label: string }[] = [
  { id: "sala", number: "1", label: "Sala" },
  { id: "show", number: "2", label: "Show" },
  { id: "jugadores", number: "3", label: "Jugadores" },
];

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-pin": getAdminPin() ?? "",
    "x-session-code": getSessionCode() ?? "",
  };
}

const emptySummary: VotingSummary = {
  totalVotes: 0,
  currentRoundVotes: 0,
  participantCount: 0,
  currentRoundParticipantCount: 0,
  objectSubmissionCount: 0,
};

const fieldClass =
  "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 outline-none focus:border-tava-purple";

export function VotingAdminPanel() {
  const code = getSessionCode();
  const [session, setSession] = useState<VotingSession | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(ARTIST_COLORS[0]!);
  const [newAvatarGender, setNewAvatarGender] = useState<AvatarGender>("male");
  const [newTagline, setNewTagline] = useState(ARTIST_TAGLINES[0]!);
  const [liveResults, setLiveResults] = useState<ArtistResult[]>([]);
  const [summary, setSummary] = useState<VotingSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [participantMessage, setParticipantMessage] = useState(DEFAULT_PARTICIPANT_MESSAGE);
  const [dailyGames, setDailyGames] = useState<DailyGame[]>([]);
  const [configSaved, setConfigSaved] = useState("");
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<string[]>([]);
  const [rouletteWinner, setRouletteWinner] = useState("");
  const [step, setStep] = useState<AdminStep>("sala");
  const configTouchedRef = useRef(false);

  const applySessionConfig = useCallback((nextSession: VotingSession | null | undefined) => {
    if (configTouchedRef.current || !nextSession) return;
    setParticipantMessage(nextSession.participant_message || DEFAULT_PARTICIPANT_MESSAGE);
    setDailyGames(nextSession.daily_games ?? []);
  }, []);

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/voting/session?code=${encodeURIComponent(code)}&includeResults=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data.session);
      setArtists(data.artists ?? []);
      setLiveResults(data.results ?? []);
      setSummary(data.summary ?? emptySummary);
      applySessionConfig(data.session);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [code, applySessionConfig]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [refresh]);

  const addArtist = async () => {
    if (!newName.trim()) return;
    setBusyAction("artist");
    try {
      const res = await fetch("/api/voting/artists", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({
          name: newName.trim(),
          color: newColor,
          avatarGender: newAvatarGender,
          tagline: newTagline,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      const nextIndex = artists.length + 1;
      setNewName("");
      setNewColor(ARTIST_COLORS[nextIndex % ARTIST_COLORS.length]!);
      setNewAvatarGender(nextIndex % 2 === 0 ? "male" : "female");
      setNewTagline(ARTIST_TAGLINES[nextIndex % ARTIST_TAGLINES.length]!);
      void refresh();
    } finally {
      setBusyAction(null);
    }
  };

  const updateArtist = async (artist: Artist, updates: Partial<Artist>) => {
    setBusyAction(artist.id);
    try {
      const res = await fetch("/api/voting/artists", {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({
          id: artist.id,
          name: updates.name ?? artist.name,
          color: updates.color ?? artist.color,
          avatarGender: updates.avatar_gender ?? artist.avatar_gender,
          tagline: updates.tagline ?? artist.tagline,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      setArtists((prev) => prev.map((item) => (item.id === artist.id ? data.artist : item)));
    } finally {
      setBusyAction(null);
    }
  };

  const removeArtist = async (id: string) => {
    await fetch(`/api/voting/artists?id=${id}`, { method: "DELETE", headers: adminHeaders() });
    void refresh();
  };

  const patchSession = async (body: Record<string, unknown>, label: string) => {
    setBusyAction(label);
    setError("");
    try {
      const res = await fetch("/api/voting/session", {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return data;
      }
      void refresh();
      return data;
    } finally {
      setBusyAction(null);
    }
  };

  const saveSessionConfig = async (goNext = false) => {
    setConfigSaved("");
    setError("");

    const incompleteGames = dailyGames.filter((game) => !game.name.trim());
    if (incompleteGames.length > 0) {
      setError("Cada juego necesita un nombre antes de guardar.");
      return;
    }

    const data = await patchSession(
      {
        participant_message: participantMessage,
        daily_games: dailyGames,
      },
      "save-config"
    );

    if (data?.session) {
      configTouchedRef.current = false;
      setParticipantMessage(data.session.participant_message || DEFAULT_PARTICIPANT_MESSAGE);
      setDailyGames(data.session.daily_games ?? []);
      setConfigSaved("Configuracion guardada");
      setTimeout(() => setConfigSaved(""), 2000);
      if (goNext) setStep("jugadores");
    }
  };

  const addDailyGame = () => {
    configTouchedRef.current = true;
    setDailyGames((prev) => [...prev, { id: crypto.randomUUID(), name: "", description: "" }]);
  };

  const updateDailyGame = (id: string, updates: Partial<DailyGame>) => {
    configTouchedRef.current = true;
    setDailyGames((prev) => prev.map((game) => (game.id === id ? { ...game, ...updates } : game)));
  };

  const removeDailyGame = (id: string) => {
    configTouchedRef.current = true;
    setDailyGames((prev) => prev.filter((game) => game.id !== id));
  };

  const drawObjects = async () => {
    setBusyAction("draw-objects");
    setError("");
    try {
      const res = await fetch("/api/voting/session", {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ action: "draw_objects" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      const winner = data.winner ?? data.selectedObjects?.[0] ?? "";
      const candidates = data.rouletteCandidates ?? data.session?.roulette_candidates ?? [];
      setRouletteItems(candidates.length > 0 ? candidates : winner ? [winner] : []);
      setRouletteWinner(winner);
      setRouletteOpen(true);
      void refresh();
    } finally {
      setBusyAction(null);
    }
  };

  const selectedObjects = session?.selected_objects ?? [];
  const round = session?.current_round ?? 1;
  const possibleVotes = summary.currentRoundParticipantCount * Math.max(artists.length, 1);
  const statusCopy = useMemo(() => {
    if (!session) return "Sin sesion";
    if (session.show_results) return "Ranking publicado";
    if (session.object_collection_open) return "Recibiendo objetos";
    if (session.is_open) return "Votacion abierta";
    return "Votacion cerrada";
  }, [session]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-tava-purple/20 border-t-tava-purple"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WordRoulette
        items={rouletteItems}
        winner={rouletteWinner}
        open={rouletteOpen}
        onComplete={() => setRouletteOpen(false)}
      />

      <div className="shrink-0 px-3 pt-1 sm:px-4">
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          {STEPS.map((item) => {
            const active = step === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id)}
                className={`min-h-11 rounded-xl px-2 py-2 text-center transition ${
                  active ? "bg-tava-purple text-white shadow-sm" : "text-gray-500"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{item.number}</p>
                <p className="text-xs font-black sm:text-sm">{item.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-4">
        {liveResults.length > 0 && step !== "show" && (
          <div className="mb-3">
            <LiveScoreboard results={liveResults} compact />
          </div>
        )}

        {step === "sala" && session && (
          <div className="space-y-3">
            <section className="rounded-2xl border border-tava-purple/30 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Codigo de sala</p>
                  <p className="font-display text-3xl font-black tracking-widest text-tava-purple">{session.code}</p>
                  <p className="mt-1 text-sm text-gray-600">{session.title}</p>
                </div>
                <div className="rounded-2xl bg-purple-50 px-4 py-3 text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-tava-purple">Estado</p>
                  <p className="font-display text-base font-black text-gray-800">{statusCopy}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard label="Ronda" value={round} />
                <StatCard label="Votos" value={summary.currentRoundVotes} />
                <StatCard label="Votantes" value={summary.currentRoundParticipantCount} />
                <StatCard
                  label="Progreso"
                  value={`${possibleVotes ? Math.round((summary.currentRoundVotes / possibleVotes) * 100) : 0}%`}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="font-display text-lg font-bold text-gray-800">Control de votacion</h2>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={!!busyAction}
                  onClick={() =>
                    void patchSession({ is_open: !session.is_open }, session.is_open ? "close-vote" : "open-vote")
                  }
                  className="min-h-12 rounded-xl bg-tava-purple text-sm font-bold text-white disabled:opacity-50"
                >
                  {session.is_open ? "Cerrar votacion actual" : `Abrir votacion (ronda ${round})`}
                </button>
                <button
                  type="button"
                  disabled={session.is_open || !!busyAction}
                  onClick={() => void patchSession({ action: "new_round" }, "new-round")}
                  className="min-h-12 rounded-xl border-2 border-tava-neon-pink bg-pink-50 text-sm font-bold text-tava-neon-pink disabled:opacity-40"
                >
                  Nueva ronda ({round + 1})
                </button>
                <button
                  type="button"
                  disabled={!!busyAction}
                  onClick={() => void patchSession({ show_results: true, is_open: false }, "publish")}
                  className="min-h-12 rounded-xl border-2 border-amber-400 bg-amber-50 text-sm font-bold text-amber-800 disabled:opacity-50"
                >
                  Publicar podio y ranking
                </button>
              </div>
            </section>

            {liveResults.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="font-display text-lg font-bold text-gray-800">Ranking acumulado</h2>
                <div className="mt-2">
                  <VotingResults results={liveResults} reveal podium={session.show_results} />
                </div>
              </section>
            )}
          </div>
        )}

        {step === "show" && (
          <div className="space-y-3">
            <section className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500">Paso 2</p>
              <h2 className="font-display text-xl font-black text-gray-900">Informacion del show</h2>
              <p className="mt-1 text-sm text-gray-500">
                Esto es lo que veran los participantes al entrar, antes de votar.
              </p>
              {configSaved && <p className="mt-2 text-sm font-bold text-green-600">{configSaved}</p>}

              <label className="mt-4 block text-xs font-black uppercase tracking-wide text-gray-500">
                Mensaje de bienvenida
              </label>
              <textarea
                value={participantMessage}
                onChange={(e) => {
                  configTouchedRef.current = true;
                  setParticipantMessage(e.target.value);
                }}
                rows={8}
                className={`${fieldClass} mt-1 resize-y leading-relaxed`}
              />

              {participantMessage.trim() && (
                <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    Asi lo vera el publico
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {participantMessage}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-800">Juegos del dia</h2>
                  <p className="text-xs text-gray-500">Nombre y descripcion para cada juego.</p>
                </div>
                <button
                  type="button"
                  onClick={addDailyGame}
                  className="min-h-11 shrink-0 rounded-xl bg-purple-50 px-3 text-sm font-bold text-tava-purple"
                >
                  + Juego
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {dailyGames.length === 0 && (
                  <p className="rounded-xl bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
                    Todavia no hay juegos. Agrega los de esta noche.
                  </p>
                )}
                {dailyGames.map((game, index) => (
                  <div key={game.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-gray-400">Juego {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeDailyGame(game.id)}
                        className="min-h-8 px-2 text-xs font-bold text-red-500"
                      >
                        Quitar
                      </button>
                    </div>
                    <input
                      value={game.name}
                      onChange={(e) => updateDailyGame(game.id, { name: e.target.value })}
                      placeholder="Nombre del juego"
                      className={fieldClass}
                    />
                    <textarea
                      value={game.description}
                      onChange={(e) => updateDailyGame(game.id, { description: e.target.value })}
                      rows={3}
                      placeholder="Descripcion, reglas o dinamica"
                      className={`${fieldClass} mt-2 resize-y`}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {step === "jugadores" && (
          <div className="space-y-3">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-800">Palabra de la ronda</h2>
                  <p className="text-xs text-gray-500">Recibe objetos y sortea una palabra.</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    session?.object_collection_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {session?.object_collection_open ? "Abierto" : "Cerrado"}
                </span>
              </div>

              {selectedObjects.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {selectedObjects.map((objectName, index) => (
                    <motion.div
                      key={objectName}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-center font-display text-lg font-black text-amber-900"
                    >
                      {objectName}
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={!!busyAction}
                  onClick={() => void patchSession({ action: "open_objects" }, "open-objects")}
                  className="min-h-12 rounded-xl border-2 border-green-500 bg-green-50 text-sm font-bold text-green-700 disabled:opacity-50"
                >
                  Recibir objetos
                </button>
                <button
                  type="button"
                  disabled={!!busyAction}
                  onClick={() => void patchSession({ action: "close_objects" }, "close-objects")}
                  className="min-h-12 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-700 disabled:opacity-50"
                >
                  Cerrar recepcion
                </button>
                <button
                  type="button"
                  disabled={!!busyAction || summary.objectSubmissionCount === 0}
                  onClick={() => void drawObjects()}
                  className="min-h-12 rounded-xl bg-amber-500 text-sm font-bold text-white disabled:opacity-40"
                >
                  {selectedObjects.length > 0 ? "Cambiar palabra" : "Sortear palabra"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="font-display text-lg font-bold text-gray-800">Jugadores / artistas</h2>
              <div className="mt-3 grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre del jugador"
                  className={fieldClass}
                  onKeyDown={(e) => e.key === "Enter" && void addArtist()}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={newAvatarGender}
                    onChange={(e) => setNewAvatarGender(e.target.value as AvatarGender)}
                    className={fieldClass}
                  >
                    <option value="male">Muneco hombre</option>
                    <option value="female">Muneca mujer</option>
                  </select>
                  <select
                    value={newTagline}
                    onChange={(e) => setNewTagline(e.target.value)}
                    className={fieldClass}
                  >
                    {ARTIST_TAGLINES.map((tagline) => (
                      <option key={tagline} value={tagline}>
                        {tagline}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ARTIST_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Color ${color}`}
                      onClick={() => setNewColor(color)}
                      className={`h-10 w-10 rounded-full border-2 ${newColor === color ? "border-gray-900" : "border-white"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!newName.trim() || !!busyAction}
                  onClick={() => void addArtist()}
                  className="min-h-12 rounded-xl bg-tava-neon-pink text-sm font-bold text-white disabled:opacity-40"
                >
                  Agregar jugador
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {artists.map((artist) => (
                  <ArtistIdentityCard key={artist.id} artist={artist} compact>
                    <div className="grid gap-2">
                      <div className="flex flex-wrap gap-2">
                        {ARTIST_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={`Color ${color}`}
                            onClick={() => void updateArtist(artist, { color })}
                            className={`h-8 w-8 rounded-full border-2 ${
                              artist.color === color ? "border-gray-900" : "border-white"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select
                          value={artist.avatar_gender || "male"}
                          disabled={busyAction === artist.id}
                          onChange={(e) => void updateArtist(artist, { avatar_gender: e.target.value as AvatarGender })}
                          className="min-h-11 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        >
                          <option value="male">Muneco hombre</option>
                          <option value="female">Muneca mujer</option>
                        </select>
                        <select
                          value={artist.tagline || ARTIST_TAGLINES[0]}
                          disabled={busyAction === artist.id}
                          onChange={(e) => void updateArtist(artist, { tagline: e.target.value })}
                          className="min-h-11 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        >
                          {ARTIST_TAGLINES.map((tagline) => (
                            <option key={tagline} value={tagline}>
                              {tagline}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeArtist(artist.id)}
                        className="min-h-11 rounded-xl border border-red-200 text-xs font-bold text-red-500"
                      >
                        Eliminar jugador
                      </button>
                    </div>
                  </ArtistIdentityCard>
                ))}
              </div>
            </section>
          </div>
        )}

        {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
      </div>

      <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-4">
        {step === "sala" && (
          <button
            type="button"
            onClick={() => setStep("show")}
            className="min-h-12 w-full rounded-xl bg-tava-purple text-sm font-black text-white"
          >
            Siguiente: preparar show
          </button>
        )}
        {step === "show" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!!busyAction}
              onClick={() => void saveSessionConfig(false)}
              className="min-h-12 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-black text-indigo-700 disabled:opacity-50"
            >
              {busyAction === "save-config" ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              disabled={!!busyAction}
              onClick={() => void saveSessionConfig(true)}
              className="min-h-12 rounded-xl bg-tava-purple text-sm font-black text-white disabled:opacity-50"
            >
              Guardar y seguir
            </button>
          </div>
        )}
        {step === "jugadores" && (
          <button
            type="button"
            onClick={() => setStep("sala")}
            className="min-h-12 w-full rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700"
          >
            Volver a sala
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
      <p className="font-display text-2xl font-black text-gray-800">{value}</p>
    </div>
  );
}
