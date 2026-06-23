import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireMasterAdmin } from "@/lib/voting/admin-auth";
import { computeResults } from "@/lib/voting/compute-results";
import type { Artist, Vote } from "@/lib/voting/types";

export async function GET(request: NextRequest) {
  try {
    const pin = request.headers.get("x-admin-pin");
    const code = request.headers.get("x-session-code");
    const auth = requireMasterAdmin(pin);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

    const db = getSupabaseAdmin();
    const { data: session } = await db
      .from("voting_sessions")
      .select("id, current_round")
      .eq("code", (code ?? "").toUpperCase())
      .single();

    if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

    const { data: artists } = await db
      .from("artists")
      .select("*")
      .eq("session_id", session.id)
      .order("sort_order");

    const { data: votes } = await db.from("votes").select("*").eq("session_id", session.id);

    const results = computeResults((artists ?? []) as Artist[], (votes ?? []) as Vote[]);

    return NextResponse.json({ results, currentRound: session.current_round ?? 1 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
