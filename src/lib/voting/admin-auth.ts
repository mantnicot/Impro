import { verifyMasterAdminCode } from "@/lib/voting/master-admin";

export function requireMasterAdmin(pin: string | null): { ok: true } | { ok: false; error: string } {
  if (!pin) return { ok: false, error: "Código de administrador requerido" };
  if (!verifyMasterAdminCode(pin)) return { ok: false, error: "Código de administrador incorrecto" };
  return { ok: true };
}
