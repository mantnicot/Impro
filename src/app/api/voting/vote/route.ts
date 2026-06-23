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
      .select("is_open")
      .eq("id", sessionId)
      .single();

    if (!session?.is_open) {
      return NextResponse.json({ error: "Votación cerrada" }, { status: 403 });
    }

    const { data, error } = await db
      .from("votes")
      .upsert(
        { session_id: sessionId, artist_id: artistId, voter_id: voterId, value },
        { onConflict: "session_id,voter_id,artist_id" }
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
    if (!sessionId || !voterId) {
      return NextResponse.json({ error: "sessionId y voterId requeridos" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("votes")
      .select("artist_id, value")
      .eq("session_id", sessionId)
      .eq("voter_id", voterId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ votes: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
