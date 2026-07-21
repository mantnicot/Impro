import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, artistId, voterId, value, votes } = (await request.json()) as {
      sessionId?: string;
      artistId?: string;
      voterId?: string;
      value?: number;
      votes?: { artistId?: string; value?: number }[];
    };

    if (!sessionId || !voterId) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: session } = await db
      .from("voting_sessions")
      .select("is_open, current_round")
      .eq("id", sessionId)
      .single();

    if (!session?.is_open) {
      return NextResponse.json({ error: "Votacion cerrada" }, { status: 403 });
    }

    const round = session.current_round ?? 1;

    if (Array.isArray(votes)) {
      const { data: artists, error: artistsError } = await db
        .from("artists")
        .select("id, name")
        .eq("session_id", sessionId)
        .order("sort_order", { ascending: true });
      if (artistsError) return NextResponse.json({ error: artistsError.message }, { status: 500 });
      if (!artists?.length) {
        return NextResponse.json({ error: "No hay jugadores para votar" }, { status: 400 });
      }

      const artistIds = new Set(artists.map((artist) => artist.id as string));
      const incomingVotes = new Map<string, number>();
      for (const vote of votes) {
        if (!vote.artistId || !artistIds.has(vote.artistId)) {
          return NextResponse.json({ error: "Hay votos para jugadores invalidos" }, { status: 400 });
        }
        const voteValue = vote.value;
        if (typeof voteValue !== "number" || !Number.isInteger(voteValue) || voteValue < 1 || voteValue > 5) {
          return NextResponse.json({ error: "Todos los votos deben estar entre 1 y 5" }, { status: 400 });
        }
        incomingVotes.set(vote.artistId, voteValue);
      }

      const { data: existingVotes, error: existingError } = await db
        .from("votes")
        .select("*")
        .eq("session_id", sessionId)
        .eq("voter_id", voterId)
        .eq("round", round);
      if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

      const existingArtistIds = new Set((existingVotes ?? []).map((vote) => vote.artist_id as string));
      const missingArtists = artists.filter(
        (artist) => !existingArtistIds.has(artist.id as string) && !incomingVotes.has(artist.id as string)
      );
      if (missingArtists.length > 0) {
        return NextResponse.json(
          {
            error: `Falta votar por: ${missingArtists.map((artist) => artist.name).join(", ")}`,
            missingArtists: missingArtists.map((artist) => artist.name),
          },
          { status: 400 }
        );
      }

      const rowsToInsert = artists
        .filter((artist) => !existingArtistIds.has(artist.id as string))
        .map((artist) => ({
          session_id: sessionId,
          artist_id: artist.id,
          voter_id: voterId,
          value: incomingVotes.get(artist.id as string)!,
          round,
        }));

      if (rowsToInsert.length === 0) {
        return NextResponse.json({ votes: existingVotes ?? [], ok: true });
      }

      const { data, error } = await db.from("votes").insert(rowsToInsert).select("*");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ votes: [...(existingVotes ?? []), ...(data ?? [])], ok: true });
    }

    if (!artistId || value == null) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    if (value < 1 || value > 5) {
      return NextResponse.json({ error: "Voto debe ser 1-5" }, { status: 400 });
    }

    const { data: existingVote } = await db
      .from("votes")
      .select("*")
      .eq("session_id", sessionId)
      .eq("artist_id", artistId)
      .eq("voter_id", voterId)
      .eq("round", round)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: "Ya votaste por este participante en esta ronda", vote: existingVote },
        { status: 409 }
      );
    }

    const { data, error } = await db
      .from("votes")
      .insert({ session_id: sessionId, artist_id: artistId, voter_id: voterId, value, round })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vote: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    const voterId = request.nextUrl.searchParams.get("voterId");
    const roundParam = request.nextUrl.searchParams.get("round");
    if (!sessionId || !voterId) {
      return NextResponse.json({ error: "sessionId y voterId requeridos" }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    let round = roundParam ? Number(roundParam) : null;
    if (round == null || Number.isNaN(round)) {
      const { data: session } = await db
        .from("voting_sessions")
        .select("current_round")
        .eq("id", sessionId)
        .single();
      round = session?.current_round ?? 1;
    }

    const { data, error } = await db
      .from("votes")
      .select("artist_id, value, round")
      .eq("session_id", sessionId)
      .eq("voter_id", voterId)
      .eq("round", round);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ votes: data ?? [], round });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
