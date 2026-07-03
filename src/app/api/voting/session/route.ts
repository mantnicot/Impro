import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireMasterAdmin } from "@/lib/voting/admin-auth";
import { computeResults } from "@/lib/voting/compute-results";
import { generateSessionCode, hashPin } from "@/lib/voting/pin";
import { verifyMasterAdminCode } from "@/lib/voting/master-admin";
import type {
  Artist,
  RoundObjectSubmission,
  Vote,
  VotingSession,
  VotingSummary,
} from "@/lib/voting/types";

type StoredSession = VotingSession & { admin_pin_hash: string };

function sessionSelect() {
  return [
    "id",
    "code",
    "title",
    "is_open",
    "show_results",
    "current_round",
    "object_collection_open",
    "selected_objects",
    "created_at",
  ].join(", ");
}

async function loadSessionByCode(code: string) {
  const db = getSupabaseAdmin();
  const { data: session, error } = await db
    .from("voting_sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
  if (error || !session) return null;
  return session as StoredSession;
}

function summarizeVotes(votes: Vote[], round: number, objectSubmissionCount: number): VotingSummary {
  const currentRoundVotes = votes.filter((v) => (v.round ?? 1) === round);
  return {
    totalVotes: votes.length,
    currentRoundVotes: currentRoundVotes.length,
    participantCount: new Set(votes.map((v) => v.voter_id)).size,
    currentRoundParticipantCount: new Set(currentRoundVotes.map((v) => v.voter_id)).size,
    objectSubmissionCount,
  };
}

function uniqueObjectNames(rows: RoundObjectSubmission[]): string[] {
  const seen = new Set<string>();
  const objects: string[] = [];
  for (const row of rows) {
    const name = row.object_name.trim().replace(/\s+/g, " ");
    const key = name.toLocaleLowerCase("es");
    if (!name || seen.has(key)) continue;
    seen.add(key);
    objects.push(name);
  }
  return objects;
}

function drawObjects(objects: string[], count = 3): string[] {
  const pool = [...objects];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count);
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const includeResults = request.nextUrl.searchParams.get("includeResults") === "true";
    const voterId = request.nextUrl.searchParams.get("voterId");
    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const session = await loadSessionByCode(code);
    if (!session) {
      return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });
    }

    const db = getSupabaseAdmin();
    const { data: artists } = await db
      .from("artists")
      .select("*")
      .eq("session_id", session.id)
      .order("sort_order", { ascending: true });

    const round = session.current_round ?? 1;
    const { data: objectRows } = await db
      .from("round_object_submissions")
      .select("*")
      .eq("session_id", session.id)
      .eq("round", round);

    let myVotes = null;
    let myObjectSubmissions = null;
    if (voterId) {
      const { data: voteRows } = await db
        .from("votes")
        .select("artist_id, value, round")
        .eq("session_id", session.id)
        .eq("voter_id", voterId)
        .eq("round", round);
      myVotes = voteRows ?? [];
      myObjectSubmissions = ((objectRows ?? []) as RoundObjectSubmission[])
        .filter((row) => row.voter_id === voterId)
        .map((row) => row.object_name);
    }

    let results = null;
    let summary: VotingSummary | null = null;
    if (session.show_results || includeResults) {
      const { data: votes } = await db.from("votes").select("*").eq("session_id", session.id);
      const safeVotes = (votes ?? []) as Vote[];
      results = computeResults((artists ?? []) as Artist[], safeVotes);
      summary = summarizeVotes(safeVotes, round, (objectRows ?? []).length);
    }

    const { admin_pin_hash: _, ...safeSession } = session;
    return NextResponse.json({
      session: safeSession,
      artists: artists ?? [],
      results,
      summary,
      myVotes,
      myObjectSubmissions,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { title, masterCode } = body as { title?: string; masterCode?: string };
      if (!verifyMasterAdminCode(masterCode ?? "")) {
        return NextResponse.json({ error: "Codigo de administrador incorrecto" }, { status: 403 });
      }

      const db = getSupabaseAdmin();
      let code = generateSessionCode();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await db.from("voting_sessions").select("id").eq("code", code).maybeSingle();
        if (!existing) break;
        code = generateSessionCode();
      }

      const { data, error } = await db
        .from("voting_sessions")
        .insert({
          code,
          title: title?.trim() || "Sesion TAVA",
          admin_pin_hash: hashPin(masterCode!),
          is_open: false,
          show_results: false,
          current_round: 1,
          object_collection_open: false,
          selected_objects: [],
        })
        .select(sessionSelect())
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    if (action === "auth") {
      const { code, masterCode } = body as { code?: string; masterCode?: string };
      if (!code || !masterCode) {
        return NextResponse.json({ error: "Codigo de sala y admin requeridos" }, { status: 400 });
      }
      if (!verifyMasterAdminCode(masterCode)) {
        return NextResponse.json({ error: "Codigo de administrador incorrecto" }, { status: 403 });
      }
      const session = await loadSessionByCode(code);
      if (!session) {
        return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });
      }
      const { admin_pin_hash: _, ...safeSession } = session;
      return NextResponse.json({ session: safeSession, ok: true });
    }

    if (action === "join") {
      const { code } = body as { code?: string };
      if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
      const session = await loadSessionByCode(code);
      if (!session) return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });
      const { admin_pin_hash: _, ...safeSession } = session;
      return NextResponse.json({ session: safeSession });
    }

    return NextResponse.json({ error: "action invalid" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const pin = request.headers.get("x-admin-pin");
    const code = request.headers.get("x-session-code");
    const auth = requireMasterAdmin(pin);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

    const session = await loadSessionByCode(code ?? "");
    if (!session) return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });

    const body = await request.json();
    const db = getSupabaseAdmin();

    if (body.action === "new_round") {
      if (session.is_open) {
        return NextResponse.json({ error: "Cierra la votacion antes de iniciar otra ronda" }, { status: 400 });
      }
      const nextRound = (session.current_round ?? 1) + 1;
      const { data, error } = await db
        .from("voting_sessions")
        .update({
          current_round: nextRound,
          is_open: true,
          show_results: false,
          object_collection_open: false,
          selected_objects: [],
        })
        .eq("id", session.id)
        .select(sessionSelect())
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    if (body.action === "open_objects") {
      const { data, error } = await db
        .from("voting_sessions")
        .update({ object_collection_open: true, selected_objects: [], show_results: false })
        .eq("id", session.id)
        .select(sessionSelect())
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    if (body.action === "close_objects") {
      const { data, error } = await db
        .from("voting_sessions")
        .update({ object_collection_open: false })
        .eq("id", session.id)
        .select(sessionSelect())
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    if (body.action === "draw_objects") {
      const { data: objectRows, error: objectsError } = await db
        .from("round_object_submissions")
        .select("*")
        .eq("session_id", session.id)
        .eq("round", session.current_round ?? 1);
      if (objectsError) return NextResponse.json({ error: objectsError.message }, { status: 500 });

      const selected = drawObjects(uniqueObjectNames((objectRows ?? []) as RoundObjectSubmission[]), 3);
      if (selected.length === 0) {
        return NextResponse.json({ error: "Aun no hay objetos para sortear" }, { status: 400 });
      }

      const { data, error } = await db
        .from("voting_sessions")
        .update({ selected_objects: selected, object_collection_open: false })
        .eq("id", session.id)
        .select(sessionSelect())
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data, selectedObjects: selected });
    }

    const updates: Record<string, boolean | string | number> = {};
    if (typeof body.is_open === "boolean") updates.is_open = body.is_open;
    if (typeof body.show_results === "boolean") updates.show_results = body.show_results;
    if (typeof body.object_collection_open === "boolean") {
      updates.object_collection_open = body.object_collection_open;
    }
    if (typeof body.title === "string") updates.title = body.title.trim();

    const { data, error } = await db
      .from("voting_sessions")
      .update(updates)
      .eq("id", session.id)
      .select(sessionSelect())
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pin = request.headers.get("x-admin-pin");
    const code = request.headers.get("x-session-code");
    const auth = requireMasterAdmin(pin);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

    const session = await loadSessionByCode(code ?? "");
    if (!session) return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });

    const db = getSupabaseAdmin();
    await db.from("voting_sessions").delete().eq("id", session.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
