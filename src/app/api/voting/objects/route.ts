import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function normalizeObjectName(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 48);
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, voterId, objectName } = (await request.json()) as {
      sessionId?: string;
      voterId?: string;
      objectName?: string;
    };

    const normalized = normalizeObjectName(objectName ?? "");
    if (!sessionId || !voterId || !normalized) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    if (normalized.length < 2) {
      return NextResponse.json({ error: "Objeto demasiado corto" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: session } = await db
      .from("voting_sessions")
      .select("id, object_collection_open, current_round")
      .eq("id", sessionId)
      .single();

    if (!session?.object_collection_open) {
      return NextResponse.json({ error: "La recepcion de objetos esta cerrada" }, { status: 403 });
    }

    const round = session.current_round ?? 1;
    const { data, error } = await db
      .from("round_object_submissions")
      .upsert(
        {
          session_id: sessionId,
          voter_id: voterId,
          object_name: normalized,
          round,
        },
        { onConflict: "session_id,voter_id,object_name,round" }
      )
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ object: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
