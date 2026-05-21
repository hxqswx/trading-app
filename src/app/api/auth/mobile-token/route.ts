/**
 * POST /api/auth/mobile-token
 *
 * Mobile-specific auth endpoint.
 * Accepts email + password, returns a signed JWT for use in the mobile app.
 * Token is verified by passing it as `Authorization: Bearer <token>`.
 *
 * Signing: HMAC-SHA256 with AUTH_SECRET (same secret as NextAuth).
 * Payload: { sub, email, name, iat, exp }  — 30-day expiry.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/auth-crypto";

export const runtime = "nodejs";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-prod";
const EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

function b64url(s: string) {
  return Buffer.from(s).toString("base64url");
}

function signToken(payload: Record<string, unknown>): string {
  const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = b64url(JSON.stringify(payload));
  const data    = `${header}.${body}`;
  const sig     = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyMobileToken(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    // Constant-time comparison
    const a = Buffer.from(sig,      "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Record<string, unknown>;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const { email = "", password: rawPassword = "" } = body;
  const password = rawPassword.trim(); // 去除手机键盘可能带入的空格
  console.log("[mobile-token] email:", email, "| password bytes:", [...password].map(c => c.charCodeAt(0)));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // ── Demo mode：密码 demo123 始终可登录（无论是否有 DB）─────────────────────
  if (password === "demo123") {
    const iat = Math.floor(Date.now() / 1000);
    const token = signToken({ sub: "demo", email, name: "Demo User", iat, exp: iat + EXPIRY });
    return NextResponse.json({ token, user: { id: "demo", email, name: "Demo User" } });
  }

  const sql = getDb();

  // ── 无 DB：只允许 demo 账号（已在上面处理）────────────────────────────────
  if (!sql) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // ── DB mode ────────────────────────────────────────────────────────────────
  try {
    const rows = (await sql`
      SELECT id, email, name, password_hash FROM users
      WHERE email = ${email.toLowerCase().trim()}
    `) as Array<{ id: string; email: string; name: string; password_hash: string }>;

    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const iat = Math.floor(Date.now() / 1000);
    const token = signToken({ sub: user.id, email: user.email, name: user.name, iat, exp: iat + EXPIRY });
    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("[/api/auth/mobile-token]", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
