import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateSessionCode, hashPin, verifyPin } from "@/lib/voting/pin";
import type { Artist, Vote, VotingSession } from "@/lib/voting/types";

function computeResults(artists: Artist[], votes: Vote[]) {
  return artists
    .map((artist) => {
      const artistVotes = votes.filter((v) => v.artist_id === artist.id);
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
}

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
      const { title, pin } = body as { title?: string; pin?: string };
      if (!pin || pin.length < 4) {
        return NextResponse.json({ error: "PIN mínimo 4 dígitos" }, { status: 400 });
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
          admin_pin_hash: hashPin(pin),
          is_open: false,
          show_results: false,
        })
        .select("id, code, title, is_open, show_results, created_at")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    if (action === "auth") {
      const { code, pin } = body as { code?: string; pin?: string };
      if (!code || !pin) {
        return NextResponse.json({ error: "code y pin requeridos" }, { status: 400 });
      }
      const session = await loadSessionByCode(code);
      if (!session || !verifyPin(pin, session.admin_pin_hash)) {
        return NextResponse.json({ error: "Código o PIN incorrecto" }, { status: 401 });
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
    if (!pin || !code) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const session = await loadSessionByCode(code);
    if (!session || !verifyPin(pin, session.admin_pin_hash)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, boolean | string> = {};
    if (typeof body.is_open === "boolean") updates.is_open = body.is_open;
    if (typeof body.show_results === "boolean") updates.show_results = body.show_results;
    if (typeof body.title === "string") updates.title = body.title.trim();

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("voting_sessions")
      .update(updates)
      .eq("id", session.id)
      .select("id, code, title, is_open, show_results, created_at")
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
    if (!pin || !code) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const session = await loadSessionByCode(code);
    if (!session || !verifyPin(pin, session.admin_pin_hash)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const db = getSupabaseAdmin();
    await db.from("voting_sessions").delete().eq("id", session.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
