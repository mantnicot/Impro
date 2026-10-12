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
        }`}
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
            <h3 className="truncate font-display text-lg leading-tight tracking-wide">{artist.name}</h3>
            <p className="mt-0.5 truncate font-hand text-sm opacity-90">{artist.tagline || "En el acto"}</p>
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
      } ${muted ? "opacity-80" : ""}`}
      style={{ backgroundColor: color, color: ink }}
    >
      {/* Halftone TAVA */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#FFC600_0.9px,transparent_0.9px)] [background-size:14px_14px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.16),transparent_45%,rgba(11,18,32,0.18))]" />

      {/* Número álbum */}
      <p
        aria-hidden
        className="pointer-events-none absolute left-2 top-10 font-display text-[7.5rem] leading-none tracking-tight opacity-[0.14] sm:text-[9rem]"
        style={{ color: ink }}
      >
        {String(number).padStart(2, "0")}
      </p>

      {/* Contenido principal */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-2 px-3 pt-3 sm:px-4 sm:pt-4">
          <div>
            <p className="font-display text-sm tracking-[0.12em] text-tava-yellow drop-shadow-[2px_2px_0_rgba(11,18,32,0.45)] sm:text-base">
              #TAVA
            </p>
            <span className="-mt-0.5 inline-block -rotate-1 bg-tava-red px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.16em] text-white shadow-[2px_2px_0_rgba(11,18,32,0.35)] sm:text-xs">
              en el acto
            </span>
          </div>
          <div className="rounded-md border-2 border-tava-yellow bg-white px-1.5 py-1 text-center shadow-sm">
            <p className="font-display text-[9px] leading-none tracking-wide text-tava-blue">PANINI</p>
            <p className="mt-0.5 font-hand text-[10px] leading-none text-tava-red">TAVA</p>
          </div>
        </header>

        <div className="relative mx-auto mt-1 flex min-h-0 w-full flex-1 items-end justify-center px-2 pb-2 sm:px-3">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={artist.name}
              className="max-h-full w-auto max-w-[88%] object-contain object-bottom drop-shadow-[0_12px_18px_rgba(11,18,32,0.35)]"
            />
          ) : (
            <div
              className="mb-6 flex h-40 w-40 items-center justify-center rounded-full border-4 border-white/50 bg-black/15 font-display text-5xl sm:h-48 sm:w-48 sm:text-6xl"
              style={{ color: ink }}
            >
              {initials(artist.name)}
            </div>
          )}
        </div>

        <footer className="relative border-t-4 border-tava-yellow bg-[rgba(11,18,32,0.88)] px-3 py-3 text-white sm:px-4 sm:py-3.5">
          <p className="font-hand text-sm text-tava-yellow sm:text-base">{artist.tagline || "Impro TAVA"}</p>
          <h3 className="font-display text-2xl leading-none tracking-wide sm:text-3xl">{artist.name}</h3>
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
