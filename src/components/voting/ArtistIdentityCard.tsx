"use client";

import type { ReactNode } from "react";
import type { Artist } from "@/lib/voting/types";

interface ArtistIdentityCardProps {
  artist: Artist;
  children?: ReactNode;
  compact?: boolean;
  muted?: boolean;
}

function artistColor(artist: Artist): string {
  return artist.color || "#F87171";
}

function ArtistAvatar({ artist }: { artist: Artist }) {
  const isFemale = artist.avatar_gender === "female";
  const color = artistColor(artist);

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-gray-900 bg-white shadow-sm">
      <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
        <rect x="10" y="12" width="60" height="60" rx="10" fill="#fff" stroke="#111827" strokeWidth="3" />
        {isFemale ? (
          <>
            <path d="M24 38 C18 20, 34 12, 47 16 C61 20, 63 34, 58 50 C51 43, 35 43, 24 50 Z" fill="#111827" />
            <circle cx="40" cy="38" r="15" fill="#F7D7C6" stroke="#111827" strokeWidth="2" />
            <path d="M25 36 C31 31, 39 25, 55 32" stroke="#111827" strokeWidth="5" fill="none" />
          </>
        ) : (
          <>
            <path d="M25 29 C30 17, 52 17, 57 30 L55 35 C47 29, 34 29, 25 36 Z" fill="#111827" />
            <circle cx="40" cy="39" r="16" fill="#F7D7C6" stroke="#111827" strokeWidth="2" />
            <path d="M26 54 C34 48, 47 48, 55 54 L59 68 H22 Z" fill="#fff" stroke="#111827" strokeWidth="3" />
          </>
        )}
        <circle cx="34" cy="39" r="2.2" fill="#111827" />
        <circle cx="46" cy="39" r="2.2" fill="#111827" />
        <path d="M34 49 C38 52, 43 52, 47 49" stroke="#111827" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="32" y="43" width="16" height="5" rx="2.5" fill={color} />
      </svg>
    </div>
  );
}

export function ArtistIdentityCard({ artist, children, compact = false, muted = false }: ArtistIdentityCardProps) {
  const color = artistColor(artist);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border-2 bg-white p-4 shadow-sm transition ${
        muted ? "opacity-70" : ""
      }`}
      style={{ borderColor: color }}
    >
      <div className="absolute left-0 top-0 h-full w-2" style={{ backgroundColor: color }} />
      <div className={`flex gap-4 ${compact ? "items-center" : "items-start"}`}>
        <div className="pt-1">
          <ArtistAvatar artist={artist} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Carnet TAVA</p>
          <h3 className="break-words font-display text-2xl font-black leading-tight text-gray-900">
            {artist.name}
          </h3>
          <p className="mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold text-gray-900" style={{ backgroundColor: `${color}33` }}>
            {artist.tagline || "El mas chistoso"}
          </p>
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-11/12 rounded-full bg-gray-900/80" />
            <div className="h-1.5 w-9/12 rounded-full bg-gray-900/70" />
            <div className="h-1.5 w-7/12 rounded-full bg-gray-900/60" />
          </div>
        </div>
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </article>
  );
}
