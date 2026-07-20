export interface VotingSession {
  id: string;
  code: string;
  title: string;
  is_open: boolean;
  show_results: boolean;
  current_round: number;
  object_collection_open: boolean;
  selected_objects: string[];
  created_at: string;
}

export interface Artist {
  id: string;
  session_id: string;
  name: string;
  color: string;
  avatar_gender: "male" | "female";
  tagline: string;
  sort_order: number;
  created_at: string;
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
