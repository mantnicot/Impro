import { createHash, randomBytes } from "crypto";

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin.trim()).digest("hex");
}

export function verifyPin(pin: string, hash: string): boolean {
  return hashPin(pin) === hash;
}

export function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TAVA";
  const bytes = randomBytes(4);
  for (let i = 0; i < 2; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  return code;
}
