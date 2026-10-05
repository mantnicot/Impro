"use client";

import { useEffect, useMemo, useState } from "react";

interface RoomQrCardProps {
  code: string;
}

export function RoomQrCard({ code }: RoomQrCardProps) {
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/?join=${encodeURIComponent(code)}`);
  }, [code]);

  const qrSrc = useMemo(() => {
    if (!joinUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(joinUrl)}`;
  }, [joinUrl]);

  const copyLink = async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!joinUrl) {
    return (
      <section className="rounded-2xl border-4 border-tava-yellow bg-white p-4 text-center shadow-sm">
        <p className="font-hand text-lg text-tava-red">Entrada rapida</p>
        <h2 className="font-display text-2xl tracking-wide text-tava-blue">QR DE LA SALA</h2>
        <p className="mt-3 text-sm text-gray-400">Generando enlace…</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-4 border-tava-yellow bg-white p-4 text-center shadow-sm">
      <p className="font-hand text-lg text-tava-red">Entrada rapida</p>
      <h2 className="font-display text-2xl tracking-wide text-tava-blue">QR DE LA SALA</h2>
      <p className="mt-1 text-xs text-gray-500">Escanean e entran sin escribir el codigo.</p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt={`QR para unirse a ${code}`}
        className="mx-auto mt-4 h-48 w-48 rounded-2xl border-2 border-tava-blue/20 bg-white p-2"
      />

      <p className="mt-3 font-display text-3xl tracking-widest text-tava-blue">{code}</p>
      <p className="mt-1 break-all px-2 text-[11px] text-gray-400">{joinUrl}</p>

      <button
        type="button"
        onClick={() => void copyLink()}
        className="mt-3 min-h-11 w-full rounded-xl bg-tava-blue text-sm font-black text-white"
      >
        {copied ? "Enlace copiado" : "Copiar enlace"}
      </button>
    </section>
  );
}
