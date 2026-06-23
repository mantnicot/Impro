import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyPin } from "@/lib/voting/pin";
import type { Artist, Vote } from "@/lib/voting/types";

export async function GET(request: NextRequest) {
  try {
    const pin = request.headers.get("x-admin-pin");
    const code = request.headers.get("x-session-code");
    if (!pin || !code) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const db = getSupabaseAdmin();
    const { data: session } = await db
      .from("voting_sessions")
      .select("id, admin_pin_hash")
      .eq("code", code.toUpperCase())
      .single();

    if (!session || !verifyPin(pin, session.admin_pin_hash)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: artists } = await db
      .from("artists")
      .select("*")
      .eq("session_id", session.id)
      .order("sort_order");

    const { data: votes } = await db.from("votes").select("*").eq("session_id", session.id);

    const results = ((artists ?? []) as Artist[])
      .map((artist) => {
        const artistVotes = ((votes ?? []) as Vote[]).filter((v) => v.artist_id === artist.id);
        const totalPoints = artistVotes.reduce((s, v) => s + v.value, 0);
        const voteCount = artistVotes.length;
        return {
          artist,
          totalPoints,
          average: voteCount ? totalPoints / voteCount : 0,
          voteCount,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints || b.average - a.average);

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
