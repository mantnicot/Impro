import type { Artist, Vote } from "@/lib/voting/types";

export function computeResults(artists: Artist[], votes: Vote[]) {
  return artists
    .map((artist) => {
      const artistVotes = votes.filter((v) => v.artist_id === artist.id);
      const totalPoints = artistVotes.reduce((s, v) => s + v.value, 0);
      const voteCount = artistVotes.length;
      const roundsWithVotes = new Set(artistVotes.map((v) => v.round ?? 1)).size;
      return {
        artist,
        totalPoints,
        average: voteCount ? totalPoints / voteCount : 0,
        voteCount,
        roundsWithVotes,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || b.average - a.average);
}
