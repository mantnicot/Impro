/** Solo quien conoce este código puede crear sesiones y actuar como admin. */
const DEFAULT_MASTER_CODE = "9804";

export function getMasterAdminCode(): string {
  return process.env.TAVA_MASTER_ADMIN_CODE?.trim() || DEFAULT_MASTER_CODE;
}

export function verifyMasterAdminCode(code: string): boolean {
  const normalized = code.trim();
  return normalized.length > 0 && normalized === getMasterAdminCode();
}
