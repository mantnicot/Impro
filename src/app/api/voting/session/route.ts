import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireMasterAdmin } from "@/lib/voting/admin-auth";
import { computeResults } from "@/lib/voting/compute-results";
import { generateSessionCode, hashPin } from "@/lib/voting/pin";
import { verifyMasterAdminCode } from "@/lib/voting/master-admin";
import {
  DEFAULT_PARTICIPANT_MESSAGE,
  resolveParticipantMessage,
} from "@/lib/voting/default-participant-message";
import {
  DEFAULT_SUBMISSION_LABEL,
  DEFAULT_SUBMISSION_PROMPT,
  resolveSubmissionLabel,
  resolveSubmissionPrompt,
} from "@/lib/voting/submission-prompt";
import type {
  Artist,
  DailyGame,
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
    "submission_label",
    "submission_prompt",
    "participant_message",
    "daily_games",
    "roulette_candidates",
    "roulette_spun_at",
    "created_at",
  ].join(", ");
}

function parseDailyGames(value: unknown): DailyGame[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      name: String(item.name ?? "").trim(),
      description: String(item.description ?? "").trim(),
    }))
    .filter((game) => game.name.length > 0);
}

function normalizeSession(session: StoredSession): Omit<StoredSession, "admin_pin_hash"> {
  const { admin_pin_hash: _, ...safeSession } = session;
  return {
    ...safeSession,
    participant_message: resolveParticipantMessage(safeSession.participant_message),
    submission_label: resolveSubmissionLabel(safeSession.submission_label),
    submission_prompt: resolveSubmissionPrompt(safeSession.submission_prompt),
    daily_games: parseDailyGames(safeSession.daily_games),
    roulette_candidates: safeSession.roulette_candidates ?? [],
    roulette_spun_at: safeSession.roulette_spun_at ?? null,
  };
}

function isMissingColumnError(message: string) {
  return /column .* does not exist|Could not find the .* column/i.test(message);
}

async function loadSessionByCode(code: string) {
  const db = getSupabaseAdmin();
  const { data: session, error } = await db
    .from("voting_sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
  if (error || !session) return null;
  return session as unknown as StoredSession;
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

function drawObjects(objects: string[], count = 1): string[] {
  const pool = [...objects];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count);
}

export async function GET(request: NextRequest) {
  try {
    const listAll = request.nextUrl.searchParams.get("list") === "true";
    if (listAll) {
      const pin = request.headers.get("x-admin-pin");
      const auth = requireMasterAdmin(pin);
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

      const db = getSupabaseAdmin();
      const { data, error } = await db
        .from("voting_sessions")
        .select(
          "id, code, title, is_open, show_results, current_round, object_collection_open, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const sessions = (data ?? []).map((row) => ({
        id: row.id as string,
        code: row.code as string,
        title: row.title as string,
        is_open: Boolean(row.is_open),
        show_results: Boolean(row.show_results),
        current_round: Number(row.current_round ?? 1),
        object_collection_open: Boolean(row.object_collection_open),
        created_at: row.created_at as string,
      }));

      return NextResponse.json({ sessions, count: sessions.length });
    }

    const code = request.nextUrl.searchParams.get("code");
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
    const { data: votes } = await db.from("votes").select("*").eq("session_id", session.id);
    const safeVotes = (votes ?? []) as Vote[];
    results = computeResults((artists ?? []) as Artist[], safeVotes);
    summary = summarizeVotes(safeVotes, round, (objectRows ?? []).length);

    return NextResponse.json({
      session: normalizeSession(session),
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
          submission_label: DEFAULT_SUBMISSION_LABEL,
          submission_prompt: DEFAULT_SUBMISSION_PROMPT,
          participant_message: DEFAULT_PARTICIPANT_MESSAGE,
          daily_games: [],
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: normalizeSession(data as unknown as StoredSession) });
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
      return NextResponse.json({ session: normalizeSession(session), ok: true });
    }

    if (action === "join") {
      const { code } = body as { code?: string };
      if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
      const session = await loadSessionByCode(code);
      if (!session) return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });
      return NextResponse.json({ session: normalizeSession(session) });
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
          roulette_candidates: [],
          roulette_spun_at: null,
        })
        .eq("id", session.id)
        .select(sessionSelect())
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: normalizeSession(data as unknown as StoredSession) });
    }

    if (body.action === "open_objects") {
      const { data, error } = await db
        .from("voting_sessions")
        .update({
          object_collection_open: true,
          selected_objects: [],
          show_results: false,
          roulette_candidates: [],
          roulette_spun_at: null,
        })
        .eq("id", session.id)
        .select(sessionSelect())
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: normalizeSession(data as unknown as StoredSession) });
    }

    if (body.action === "close_objects") {
      const { data, error } = await db
        .from("voting_sessions")
        .update({ object_collection_open: false })
        .eq("id", session.id)
        .select(sessionSelect())
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: normalizeSession(data as unknown as StoredSession) });
    }

    if (body.action === "draw_objects") {
      const { data: objectRows, error: objectsError } = await db
        .from("round_object_submissions")
        .select("*")
        .eq("session_id", session.id)
        .eq("round", session.current_round ?? 1);
      if (objectsError) return NextResponse.json({ error: objectsError.message }, { status: 500 });

      const objectNames = uniqueObjectNames((objectRows ?? []) as RoundObjectSubmission[]);
      const currentSelection = new Set(
        (session.selected_objects ?? []).map((name) => name.toLocaleLowerCase("es"))
      );
      const availableObjects =
        objectNames.length > 1
          ? objectNames.filter((name) => !currentSelection.has(name.toLocaleLowerCase("es")))
          : objectNames;
      const selected = drawObjects(availableObjects, 1);
      if (selected.length === 0) {
        return NextResponse.json({ error: "Aun no hay propuestas para sortear" }, { status: 400 });
      }

      const rouletteCandidates = objectNames.length > 0 ? objectNames : selected;
      const spunAt = new Date().toISOString();

      const { data, error } = await db
        .from("voting_sessions")
        .update({
          selected_objects: selected,
          object_collection_open: false,
          roulette_candidates: rouletteCandidates,
          roulette_spun_at: spunAt,
        })
        .eq("id", session.id)
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({
        session: normalizeSession(data as unknown as StoredSession),
        selectedObjects: selected,
        rouletteCandidates,
        winner: selected[0],
      });
    }

    const updates: Record<string, boolean | string | number | DailyGame[] | string[] | null> = {};
    if (typeof body.is_open === "boolean") updates.is_open = body.is_open;
    if (typeof body.show_results === "boolean") updates.show_results = body.show_results;
    if (typeof body.object_collection_open === "boolean") {
      updates.object_collection_open = body.object_collection_open;
    }
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.participant_message === "string") {
      updates.participant_message = body.participant_message.trim();
    }
    if (typeof body.submission_label === "string") {
      updates.submission_label = resolveSubmissionLabel(body.submission_label).slice(0, 40);
    }
    if (typeof body.submission_prompt === "string") {
      updates.submission_prompt = resolveSubmissionPrompt(body.submission_prompt).slice(0, 160);
    }
    if (Array.isArray(body.daily_games)) {
      updates.daily_games = parseDailyGames(body.daily_games);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const { data, error } = await db
      .from("voting_sessions")
      .update(updates)
      .eq("id", session.id)
      .select("*")
      .single();

    if (error) {
      if (isMissingColumnError(error.message)) {
        return NextResponse.json(
          {
            error:
              "Falta una migracion en Supabase. Ejecuta supabase/migration-submission-prompt.sql (y migration-admin-panel.sql si aplica).",
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ session: normalizeSession(data as unknown as StoredSession) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pin = request.headers.get("x-admin-pin");
    const auth = requireMasterAdmin(pin);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

    const deleteAll = request.nextUrl.searchParams.get("all") === "true";
    const targetId = request.nextUrl.searchParams.get("id");
    const targetCode =
      request.nextUrl.searchParams.get("code") ?? request.headers.get("x-session-code");

    const db = getSupabaseAdmin();

    if (deleteAll) {
      const { error } = await db.from("voting_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, deleted: "all" });
    }

    if (targetId) {
      const { error } = await db.from("voting_sessions").delete().eq("id", targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, deletedId: targetId });
    }

    const session = await loadSessionByCode(targetCode ?? "");
    if (!session) return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });

    const { error } = await db.from("voting_sessions").delete().eq("id", session.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deletedCode: session.code });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
