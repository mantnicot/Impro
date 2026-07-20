"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getAdminPin, getSessionCode } from "@/lib/role-storage";
import {
  ARTIST_COLORS,
  ARTIST_TAGLINES,
  type AvatarGender,
} from "@/lib/voting/artist-style";
import type { Artist, ArtistResult, VotingSession, VotingSummary } from "@/lib/voting/types";
import { ArtistIdentityCard } from "./ArtistIdentityCard";
import { VotingResults } from "./VotingResults";

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
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [code]);

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
        return;
      }
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
    <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
      {session && (
        <section className="mb-4 rounded-2xl border border-tava-purple/30 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Codigo de sala</p>
              <p className="font-display text-3xl font-black tracking-widest text-tava-purple">{session.code}</p>
              <p className="mt-1 text-sm text-gray-600">{session.title}</p>
            </div>
            <div className="rounded-2xl bg-purple-50 px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-tava-purple">Estado</p>
              <p className="font-display text-lg font-black text-gray-800">{statusCopy}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-400">Ronda</p>
              <p className="font-display text-2xl font-black text-gray-800">{round}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-400">Votos guardados</p>
              <p className="font-display text-2xl font-black text-gray-800">{summary.currentRoundVotes}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-400">Votantes activos</p>
              <p className="font-display text-2xl font-black text-gray-800">
                {summary.currentRoundParticipantCount}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-400">Progreso</p>
              <p className="font-display text-2xl font-black text-gray-800">
                {possibleVotes ? Math.round((summary.currentRoundVotes / possibleVotes) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!!busyAction}
              onClick={() =>
                void patchSession({ is_open: !session.is_open }, session.is_open ? "close-vote" : "open-vote")
              }
              className="rounded-xl bg-tava-purple py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {session.is_open ? "Cerrar votacion actual" : `Abrir votacion (ronda ${round})`}
            </button>
            <button
              type="button"
              disabled={session.is_open || !!busyAction}
              onClick={() => void patchSession({ action: "new_round" }, "new-round")}
              className="rounded-xl border-2 border-tava-neon-pink bg-pink-50 py-3 text-sm font-bold text-tava-neon-pink disabled:opacity-40"
            >
              Nueva ronda ({round + 1})
            </button>
            <button
              type="button"
              disabled={!!busyAction}
              onClick={() => void patchSession({ show_results: true, is_open: false }, "publish")}
              className="rounded-xl border-2 border-amber-400 bg-amber-50 py-3 text-sm font-bold text-amber-800 disabled:opacity-50 sm:col-span-2"
            >
              Publicar podio y ranking acumulado
            </button>
          </div>
        </section>
      )}

      <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-gray-800">Objetos de la ronda</h2>
            <p className="text-xs text-gray-500">Los participantes proponen y el sistema sortea hasta 3.</p>
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
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
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

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={!!busyAction}
            onClick={() => void patchSession({ action: "open_objects" }, "open-objects")}
            className="rounded-xl border-2 border-green-500 bg-green-50 py-3 text-sm font-bold text-green-700 disabled:opacity-50"
          >
            Recibir objetos
          </button>
          <button
            type="button"
            disabled={!!busyAction}
            onClick={() => void patchSession({ action: "close_objects" }, "close-objects")}
            className="rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 disabled:opacity-50"
          >
            Cerrar recepcion
          </button>
          <button
            type="button"
            disabled={!!busyAction || summary.objectSubmissionCount === 0}
            onClick={() => void patchSession({ action: "draw_objects" }, "draw-objects")}
            className="rounded-xl bg-amber-500 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            Sortear 3 objetos
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
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && void addArtist()}
          />
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
            <select
              value={newAvatarGender}
              onChange={(e) => setNewAvatarGender(e.target.value as AvatarGender)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="male">Muneco hombre</option>
              <option value="female">Muneca mujer</option>
            </select>
            <select
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
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
                className={`h-8 w-8 rounded-full border-2 ${newColor === color ? "border-gray-900" : "border-white"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={!newName.trim() || !!busyAction}
            onClick={() => void addArtist()}
            className="rounded-xl bg-tava-neon-pink px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            Agregar jugador
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {artists.map((artist) => (
            <ArtistIdentityCard key={artist.id} artist={artist}>
              <div className="grid gap-2">
                <div className="flex flex-wrap gap-2">
                  {ARTIST_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Color ${color}`}
                      onClick={() => void updateArtist(artist, { color })}
                      className={`h-7 w-7 rounded-full border-2 ${
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
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  >
                    <option value="male">Muneco hombre</option>
                    <option value="female">Muneca mujer</option>
                  </select>
                  <select
                    value={artist.tagline || ARTIST_TAGLINES[0]}
                    disabled={busyAction === artist.id}
                    onChange={(e) => void updateArtist(artist, { tagline: e.target.value })}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs"
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
                  className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-500"
                >
                  Eliminar jugador
                </button>
              </div>
            </ArtistIdentityCard>
          ))}
        </div>
      </section>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

      <h2 className="mt-6 font-display text-lg font-bold text-gray-800">Ranking acumulado</h2>
      <div className="mt-2">
        <VotingResults results={liveResults} reveal podium={session?.show_results} />
      </div>
    </div>
  );
}
