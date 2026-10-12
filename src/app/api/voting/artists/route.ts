import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireMasterAdmin } from "@/lib/voting/admin-auth";
import {
  ARTIST_COLORS,
  normalizeArtistColor,
  normalizeAvatarGender,
  normalizeTagline,
} from "@/lib/voting/artist-style";
import { isPhotoDataUrl } from "@/lib/voting/compress-photo";

async function verifyAdminSession(code: string, pin: string | null) {
  const auth = requireMasterAdmin(pin);
  if (!auth.ok) return null;

  const db = getSupabaseAdmin();
  const { data: session } = await db
    .from("voting_sessions")
    .select("id")
    .eq("code", code.toUpperCase())
    .single();
  return session;
}

function normalizePhotoField(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (isPhotoDataUrl(value)) return value;
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const pin = request.headers.get("x-admin-pin");
    const code = request.headers.get("x-session-code");
    if (!pin || !code) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const session = await verifyAdminSession(code, pin);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = (await request.json()) as {
      name?: string;
      color?: string;
      avatarGender?: string;
      tagline?: string;
      photoData?: string | null;
    };
    const { name } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const photo = normalizePhotoField(body.photoData);
    if (body.photoData != null && body.photoData !== "" && photo === undefined) {
      return NextResponse.json({ error: "Foto invalida o demasiado grande" }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { count } = await db
      .from("artists")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id);

    const { data, error } = await db
      .from("artists")
      .insert({
        session_id: session.id,
        name: name.trim(),
        color: normalizeArtistColor(body.color ?? ARTIST_COLORS[(count ?? 0) % ARTIST_COLORS.length]),
        avatar_gender: normalizeAvatarGender(body.avatarGender),
        tagline: normalizeTagline(body.tagline, count ?? 0),
        photo_data: photo ?? null,
        sort_order: count ?? 0,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ artist: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pin = request.headers.get("x-admin-pin");
    const code = request.headers.get("x-session-code");
    const id = request.nextUrl.searchParams.get("id");
    if (!pin || !code || !id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 400 });
    }

    const session = await verifyAdminSession(code, pin);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const db = getSupabaseAdmin();
    const { error } = await db.from("artists").delete().eq("id", id).eq("session_id", session.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
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

    const session = await verifyAdminSession(code, pin);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = (await request.json()) as {
      id?: string;
      name?: string;
      color?: string;
      avatarGender?: string;
      tagline?: string;
      photoData?: string | null;
      clearPhoto?: boolean;
    };
    const { id, name, color, avatarGender, tagline } = body;
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "id y name requeridos" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      name: name.trim(),
      color: normalizeArtistColor(color),
      avatar_gender: normalizeAvatarGender(avatarGender),
      tagline: normalizeTagline(tagline),
    };

    if (body.clearPhoto) {
      updates.photo_data = null;
    } else if (body.photoData !== undefined) {
      const photo = normalizePhotoField(body.photoData);
      if (body.photoData !== null && photo === undefined) {
        return NextResponse.json({ error: "Foto invalida o demasiado grande" }, { status: 400 });
      }
      updates.photo_data = photo ?? null;
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("artists")
      .update(updates)
      .eq("id", id)
      .eq("session_id", session.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ artist: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
