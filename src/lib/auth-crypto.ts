/**
 * Password hashing helpers — uses Node.js built-in crypto, zero extra deps.
 * PBKDF2-SHA512 with 100k iterations and a random 16-byte salt.
 *
 * Stored format: "<hex-salt>:<hex-hash>"
 */
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

const ITERATIONS = 100_000;
const KEY_LEN    = 64;
const DIGEST     = "sha512";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const attempt = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(attempt,     "hex");
  const b = Buffer.from(storedHash,  "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
