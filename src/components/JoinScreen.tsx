"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TavaLogo } from "@/components/TavaLogo";
import {
  setAdminPin,
  setRole,
  setSessionCode,
  setSessionId,
  type UserRole,
} from "@/lib/role-storage";

interface JoinScreenProps {
  onJoined: (role: UserRole) => void;
}

export function JoinScreen({ onJoined }: JoinScreenProps) {
  const [mode, setMode] = useState<"pick" | "admin" | "participant">("pick");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [title, setTitle] = useState("Noche TAVA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const joinParticipant = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/voting/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al unirse");
      setRole("participant");
      setSessionCode(data.session.code);
      setSessionId(data.session.id);
      onJoined("participant");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/voting/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", title, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear sesión");
      setRole("admin");
      setAdminPin(pin);
      setSessionCode(data.session.code);
      setSessionId(data.session.id);
      onJoined("admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const authAdmin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/voting/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auth", code: code.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código o PIN incorrecto");
      setRole("admin");
      setAdminPin(pin);
      setSessionCode(data.session.code);
      setSessionId(data.session.id);
      onJoined("admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-theater-gradient px-4">
      <TavaLogo size="lg" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl"
      >
        {mode === "pick" && (
          <>
            <h1 className="text-center font-display text-2xl font-black text-gray-800">
              TAVA Impro
            </h1>
            <p className="mt-1 text-center text-sm text-gray-500">¿Cómo entras hoy?</p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => setMode("admin")}
                className="rounded-2xl border-2 border-tava-purple bg-gradient-to-r from-tava-purple to-tava-neon-pink py-4 font-display font-bold text-white shadow-lg"
              >
                🎭 Soy administrador
              </button>
              <button
                type="button"
                onClick={() => setMode("participant")}
                className="rounded-2xl border-2 border-gray-200 bg-white py-4 font-display font-bold text-gray-800 shadow-sm hover:border-tava-purple"
              >
                🗳️ Soy participante (votar)
              </button>
            </div>
          </>
        )}

        {mode === "participant" && (
          <>
            <button type="button" onClick={() => setMode("pick")} className="text-sm text-gray-400">
              ← Volver
            </button>
            <h2 className="mt-2 font-display text-xl font-bold text-gray-800">Unirse a votación</h2>
            <p className="text-sm text-gray-500">Ingresa el código que te dio el admin</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: TAVA42"
              className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-bold uppercase tracking-widest"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <button
              type="button"
              disabled={loading || code.length < 4}
              onClick={() => void joinParticipant()}
              className="mt-4 w-full rounded-xl bg-tava-purple py-3 font-bold text-white disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </>
        )}

        {mode === "admin" && (
          <>
            <button type="button" onClick={() => setMode("pick")} className="text-sm text-gray-400">
              ← Volver
            </button>
            <h2 className="mt-2 font-display text-xl font-bold text-gray-800">Panel administrador</h2>
            <label className="mt-4 block text-xs font-medium text-gray-500">Nombre de la noche</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2"
            />
            <label className="mt-3 block text-xs font-medium text-gray-500">Código de sala (si ya existe)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Opcional — dejar vacío para crear nueva"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 uppercase"
            />
            <label className="mt-3 block text-xs font-medium text-gray-500">PIN admin (4+ dígitos)</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              type="password"
              placeholder="••••"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-center tracking-widest"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                disabled={loading || pin.length < 4}
                onClick={() => void (code.trim() ? authAdmin() : createAdmin())}
                className="w-full rounded-xl bg-tava-purple py-3 font-bold text-white disabled:opacity-50"
              >
                {loading ? "…" : code.trim() ? "Entrar como admin" : "Crear nueva sesión"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
