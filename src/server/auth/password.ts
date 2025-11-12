// src/server/auth/password.ts
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);

// Hash format: s2$<saltBase64>$<hashBase64>
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `s2$${salt.toString("base64")}$${Buffer.from(derived).toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, saltB64, hashB64] = stored.split("$");
    if (scheme !== "s2" || !saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const derived = (await scrypt(password, salt, expected.length)) as Buffer;
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

