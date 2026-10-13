"use client";

import type { ReactNode } from "react";
import { contrastOnColor } from "@/lib/voting/artist-style";
import type { Artist } from "@/lib/voting/types";

interface ArtistIdentityCardProps {
  artist: Artist;
  children?: ReactNode;
  /** Admin / listas compactas */
  compact?: boolean;
  muted?: boolean;
  /** Carta Panini a pantalla (votación móvil) */
  stage?: boolean;
  /** Número de álbum (1-based). Si no, usa sort_order+1 */
  albumNumber?: number;
  /** Columna de votos a la derecha (1–5) */
  voteRail?: ReactNode;
  className?: string;
}

function artistColor(artist: Artist): string {
  return artist.color || "#1A3A82";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function ArtistIdentityCard({
  artist,
  children,
  compact = false,
  muted = false,
  stage = false,
  albumNumber,
  voteRail,
  className = "",
}: ArtistIdentityCardProps) {
  const color = artistColor(artist);
  const ink = contrastOnColor(color);
  const number = albumNumber ?? artist.sort_order + 1;
  const photo = artist.photo_data?.startsWith("data:image/") ? artist.photo_data : null;

  if (compact && !stage) {
    return (
      <article
        className={`relative overflow-hidden rounded-2xl border-4 border-tava-yellow shadow-[4px_4px_0_rgba(11,18,32,0.25)] transition ${
          muted ? "opacity-70" : ""
        } ${className}`}
        style={{ backgroundColor: color, color: ink }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(currentColor_0.7px,transparent_0.7px)] [background-size:10px_10px]" />
        <div className="relative flex gap-3 p-3">
          <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white/40 bg-black/10">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-contain object-bottom" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-xl">{initials(artist.name)}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-80">Panini · #TAVA</p>
            <h3 className="truncate font-display text-xl leading-tight tracking-wide sm:text-2xl">
              {artist.name}
            </h3>
            <p className="mt-1 line-clamp-2 font-hand text-base leading-snug opacity-95 sm:text-lg">
              {artist.tagline || "En el acto"}
            </p>
          </div>
        </div>
        {children && <div className="relative border-t border-white/20 bg-black/10 px-3 py-3">{children}</div>}
      </article>
    );
  }

  return (
    <article
      className={`relative flex overflow-hidden border-4 border-tava-yellow bg-white shadow-[8px_8px_0_rgba(11,18,32,0.35)] transition ${
        stage
          ? "h-[min(72dvh,560px)] w-full max-w-md rounded-[1.75rem] sm:h-[min(74dvh,640px)]"
          : "min-h-[420px] w-full max-w-sm rounded-[1.75rem]"
      } ${muted ? "opacity-80" : ""} ${className}`}
      style={{ backgroundColor: color, color: ink }}
    >
      {/* Halftone TAVA */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#FFC600_0.9px,transparent_0.9px)] [background-size:14px_14px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.16),transparent_45%,rgba(11,18,32,0.18))]" />

      {/* Número álbum (fondo, no tapa el nombre) */}
      <p
        aria-hidden
        className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 font-display text-[6.5rem] leading-none tracking-tight opacity-[0.1] sm:text-[8rem]"
        style={{ color: ink }}
      >
        {String(number).padStart(2, "0")}
      </p>

      {/* Contenido principal */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="relative z-10 px-2 pt-2.5 text-center sm:px-3 sm:pt-3">
          <div className="mb-1.5 flex items-center justify-center gap-2">
            <span className="-rotate-1 bg-tava-red px-1.5 py-0.5 font-display text-[8px] uppercase tracking-[0.14em] text-white shadow-[2px_2px_0_rgba(11,18,32,0.35)] sm:text-[9px]">
              en el acto
            </span>
            <div className="rounded-md border-2 border-tava-yellow bg-white px-1.5 py-0.5 text-center shadow-sm">
              <p className="font-display text-[8px] leading-none tracking-wide text-tava-blue sm:text-[9px]">
                PANINI
              </p>
            </div>
          </div>
          <h3
            className={`mx-auto max-w-full break-words px-1 font-display uppercase leading-[0.9] tracking-wide drop-shadow-[3px_3px_0_rgba(11,18,32,0.28)] ${
              stage
                ? "text-4xl sm:text-5xl"
                : "text-[2.75rem] sm:text-6xl md:text-7xl"
            }`}
          >
            {artist.name}
          </h3>
        </header>

        <div className="relative mx-auto mt-1 flex min-h-0 w-full flex-1 items-end justify-center px-2 pb-1 sm:px-3">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={artist.name}
              className="max-h-full w-auto max-w-[88%] object-contain object-bottom drop-shadow-[0_12px_18px_rgba(11,18,32,0.35)]"
            />
          ) : (
            <div
              className="mb-4 flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/50 bg-black/15 font-display text-5xl sm:h-44 sm:w-44 sm:text-6xl"
              style={{ color: ink }}
            >
              {initials(artist.name)}
            </div>
          )}
        </div>

        <footer className="relative shrink-0 border-t-4 border-tava-yellow bg-[rgba(11,18,32,0.9)] px-2 py-2.5 text-white sm:px-3 sm:py-3">
          <p className="line-clamp-2 break-words text-center font-hand text-lg leading-snug text-tava-yellow sm:text-xl md:text-2xl">
            {artist.tagline || "Impro TAVA"}
          </p>
        </footer>
      </div>

      {/* Rail de votos */}
      {voteRail && (
        <div className="relative z-10 flex w-[4.25rem] shrink-0 flex-col justify-center gap-1.5 border-l-4 border-tava-yellow bg-[rgba(11,18,32,0.22)] px-1.5 py-3 backdrop-blur-[2px] sm:w-20 sm:gap-2 sm:px-2">
          {voteRail}
        </div>
      )}

      {children && !voteRail && (
        <div className="absolute inset-x-0 bottom-0 z-10 p-3">{children}</div>
      )}
    </article>
  );
}

export function PaniniVoteRail({
  savedVote,
  pendingVote,
  isVoted,
  savingVotes,
  onSelect,
  ink = "#FFFFFF",
}: {
  savedVote?: number;
  pendingVote?: number;
  isVoted: boolean;
  savingVotes: boolean;
  onSelect: (value: number) => void;
  ink?: string;
}) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((value) => {
        const selected = (isVoted ? savedVote : pendingVote) === value;
        return (
          <button
            key={value}
            type="button"
            disabled={isVoted || savingVotes}
            onClick={() => onSelect(value)}
            className={`flex aspect-square w-full items-center justify-center rounded-xl border-2 font-display text-xl transition active:scale-95 disabled:opacity-60 sm:text-2xl ${
              selected
                ? "border-[#0B1220] bg-tava-yellow text-tava-blue shadow-[2px_2px_0_rgba(11,18,32,0.35)]"
                : "border-white/50 bg-white/15 text-white hover:bg-white/25"
            }`}
            style={!selected ? { color: ink === "#0B1220" ? "#0B1220" : "#FFFFFF" } : undefined}
            aria-label={`Votar ${value}`}
          >
            {value}
          </button>
        );
      })}
    </>
  );
}
