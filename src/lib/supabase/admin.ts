import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

/** Legacy JWT keys (eyJ...) work with @supabase/supabase-js. New sb_secret_* keys do not. */
function resolveSupabaseServerKey(): string {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const isJwt = (k?: string) => Boolean(k?.startsWith("eyJ"));

  if (isJwt(service)) return service!;
  if (isJwt(anon)) return anon!;
  if (service) return service;
  if (anon) return anon;
  throw new Error(
    "Supabase: usa claves Legacy (eyJ...) en NEXT_PUBLIC_SUPABASE_ANON_KEY. Las claves sb_secret_* no son válidas aquí."
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("Supabase no configurado: falta NEXT_PUBLIC_SUPABASE_URL");
  }

  const key = resolveSupabaseServerKey();
  if (!admin) {
    admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return admin;
}
