export interface VotingSession {
  id: string;
  code: string;
  title: string;
  is_open: boolean;
  show_results: boolean;
  created_at: string;
}

export interface Artist {
  id: string;
  session_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Vote {
  id: string;
  session_id: string;
  artist_id: string;
  voter_id: string;
  value: number;
  created_at: string;
}

export interface ArtistResult {
  artist: Artist;
  totalPoints: number;
  average: number;
  voteCount: number;
}
