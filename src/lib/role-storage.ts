export type UserRole = "admin" | "participant" | null;

const ROLE_KEY = "tava_role";
const SESSION_CODE_KEY = "tava_session_code";
const SESSION_ID_KEY = "tava_session_id";
const VOTER_ID_KEY = "tava_voter_id";
const ADMIN_PIN_KEY = "tava_admin_pin";

export function getVoterId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VOTER_ID_KEY, id);
  }
  return id;
}

export function getRole(): UserRole {
  if (typeof window === "undefined") return null;
  const role = sessionStorage.getItem(ROLE_KEY);
  return role === "admin" || role === "participant" ? role : null;
}

export function setRole(role: UserRole): void {
  if (typeof window === "undefined") return;
  if (role) sessionStorage.setItem(ROLE_KEY, role);
  else sessionStorage.removeItem(ROLE_KEY);
}

export function getSessionCode(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_CODE_KEY);
}

export function setSessionCode(code: string): void {
  sessionStorage.setItem(SESSION_CODE_KEY, code.toUpperCase());
}

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_ID_KEY);
}

export function setSessionId(id: string): void {
  sessionStorage.setItem(SESSION_ID_KEY, id);
}

export function getAdminPin(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_PIN_KEY);
}

export function setAdminPin(pin: string): void {
  sessionStorage.setItem(ADMIN_PIN_KEY, pin);
}

export function clearSession(): void {
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(SESSION_CODE_KEY);
  sessionStorage.removeItem(SESSION_ID_KEY);
  sessionStorage.removeItem(ADMIN_PIN_KEY);
}
