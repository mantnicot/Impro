import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireMasterAdmin } from "@/lib/voting/admin-auth";
import { computeResults } from "@/lib/voting/compute-results";
import { generateSessionCode, hashPin } from "@/lib/voting/pin";
import { verifyMasterAdminCode } from "@/lib/voting/master-admin";
import type { Artist, Vote, VotingSession } from "@/lib/voting/types";

async function loadSessionByCode(code: string) {
  const db = getSupabaseAdmin();
  const { data: session, error } = await db
    .from("voting_sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
  if (error || !session) return null;
  return session as VotingSession & { admin_pin_hash: string };
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const session = await loadSessionByCode(code);
    if (!session) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    const db = getSupabaseAdmin();
    const { data: artists } = await db
      .from("artists")
      .select("*")
      .eq("session_id", session.id)
      .order("sort_order", { ascending: true });

    let results = null;
    if (session.show_results) {
      const { data: votes } = await db.from("votes").select("*").eq("session_id", session.id);
      results = computeResults((artists ?? []) as Artist[], (votes ?? []) as Vote[]);
    }

    const { admin_pin_hash: _, ...safeSession } = session;
    return NextResponse.json({
      session: safeSession,
      artists: artists ?? [],
      results,
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
        return NextResponse.json({ error: "Código de administrador incorrecto" }, { status: 403 });
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
          title: title?.trim() || "Sesión TAVA",
          admin_pin_hash: hashPin(masterCode!),
          is_open: false,
          show_results: false,
          current_round: 1,
        })
        .select("id, code, title, is_open, show_results, current_round, created_at")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    if (action === "auth") {
      const { code, masterCode } = body as { code?: string; masterCode?: string };
      if (!code || !masterCode) {
        return NextResponse.json({ error: "Código de sala y admin requeridos" }, { status: 400 });
      }
      if (!verifyMasterAdminCode(masterCode)) {
        return NextResponse.json({ error: "Código de administrador incorrecto" }, { status: 403 });
      }
      const session = await loadSessionByCode(code);
      if (!session) {
        return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
      }
      const { admin_pin_hash: _, ...safeSession } = session;
      return NextResponse.json({ session: safeSession, ok: true });
    }

    if (action === "join") {
      const { code } = body as { code?: string };
      if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
      const session = await loadSessionByCode(code);
      if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
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
    if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

    const body = await request.json();
    const db = getSupabaseAdmin();

    if (body.action === "new_round") {
      if (session.is_open) {
        return NextResponse.json({ error: "Cierra la votación antes de iniciar otra ronda" }, { status: 400 });
      }
      const nextRound = (session.current_round ?? 1) + 1;
      const { data, error } = await db
        .from("voting_sessions")
        .update({ current_round: nextRound, is_open: true, show_results: false })
        .eq("id", session.id)
        .select("id, code, title, is_open, show_results, current_round, created_at")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    const updates: Record<string, boolean | string | number> = {};
    if (typeof body.is_open === "boolean") updates.is_open = body.is_open;
    if (typeof body.show_results === "boolean") updates.show_results = body.show_results;
    if (typeof body.title === "string") updates.title = body.title.trim();

    const { data, error } = await db
      .from("voting_sessions")
      .update(updates)
      .eq("id", session.id)
      .select("id, code, title, is_open, show_results, current_round, created_at")
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
    if (!session) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

    const db = getSupabaseAdmin();
    await db.from("voting_sessions").delete().eq("id", session.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
