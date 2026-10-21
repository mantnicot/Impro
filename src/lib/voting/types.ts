export interface DailyGame {
  id: string;
  name: string;
  description: string;
  /** Segundos. Si no viene, el tiempo lo define el admin en vivo. */
  duration_seconds?: number;
}

export interface VotingSession {
  id: string;
  code: string;
  title: string;
  is_open: boolean;
  show_results: boolean;
  current_round: number;
  object_collection_open: boolean;
  selected_objects: string[];
  submission_label: string;
  submission_prompt: string;
  participant_message: string;
  daily_games: DailyGame[];
  roulette_candidates: string[];
  roulette_spun_at: string | null;
  /** Solo proyector/TV. No cambia la UI de participantes. */
  display_scene: string;
  /** Si esta en el futuro, los celulares salen y no pueden volver a entrar. */
  audience_closed_until: string | null;
  /** Índice del juego activo (guardado dentro de daily_games JSON, sin columna extra). */
  active_game_index: number;
  /** Fin del reloj del proyector. Vacío si no hay tiempo corriendo. */
  timer_ends_at: string | null;
  created_at: string;
}

export interface Artist {
  id: string;
  session_id: string;
  name: string;
  color: string;
  avatar_gender: "male" | "female";
  tagline: string;
  /** Data URL de la foto cutout (solo esta noche). No viaja en cada poll. */
  photo_data?: string | null;
  /** Marca corta para saber si la foto cambió sin reenviar el archivo. */
  photo_rev?: string;
  sort_order: number;
  created_at: string;
}

/** Ultimo objeto/premisa sorteado (selected_objects acumula el historial de la ronda). */
export function currentDrawnObject(selected?: string[] | null): string {
  if (!selected?.length) return "";
  return selected[selected.length - 1] ?? "";
}

export interface Vote {
  id: string;
  session_id: string;
  artist_id: string;
  voter_id: string;
  value: number;
  round: number;
  created_at: string;
}

export interface ArtistResult {
  artist: Artist;
  totalPoints: number;
  average: number;
  voteCount: number;
  roundsWithVotes?: number;
  maxRound?: number;
}

export interface RoundObjectSubmission {
  id: string;
  session_id: string;
  voter_id: string;
  object_name: string;
  round: number;
  created_at: string;
}

export interface VotingSummary {
  totalVotes: number;
  currentRoundVotes: number;
  participantCount: number;
  currentRoundParticipantCount: number;
  objectSubmissionCount: number;
}
