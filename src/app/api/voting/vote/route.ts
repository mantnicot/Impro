import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, artistId, voterId, value } = (await request.json()) as {
      sessionId?: string;
      artistId?: string;
      voterId?: string;
      value?: number;
    };

    if (!sessionId || !artistId || !voterId || value == null) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    if (value < 1 || value > 5) {
      return NextResponse.json({ error: "Voto debe ser 1-5" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: session } = await db
      .from("voting_sessions")
      .select("is_open, current_round")
      .eq("id", sessionId)
      .single();

    if (!session?.is_open) {
      return NextResponse.json({ error: "Votación cerrada" }, { status: 403 });
    }

    const round = session.current_round ?? 1;

    const { data, error } = await db
      .from("votes")
      .upsert(
        { session_id: sessionId, artist_id: artistId, voter_id: voterId, value, round },
        { onConflict: "session_id,voter_id,artist_id,round" }
      )
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
