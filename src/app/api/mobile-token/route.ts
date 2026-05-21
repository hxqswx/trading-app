/**
 * POST /api/mobile-token
 *
 * Mobile auth endpoint — intentionally outside /api/auth/ to avoid
 * NextAuth's [...nextauth] catch-all intercepting the request.
 *
 * Accepts { email, password }, returns a signed JWT (30-day expiry).
 * Demo mode: any email + password "demo123" always works.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/auth-crypto";

export const runtime = "nodejs";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-prod";
const EXPIRY = 30 * 24 * 60 * 60;

function b64url(s: string) {
  return Buffer.from(s).toString("base64url");
}

function signToken(payload: Record<string, unknown>): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = b64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;
  const sig    = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyMobileToken(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
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

  const { email = "", password: rawPwd = "" } = body;
  const password = rawPwd.trim();

  const pwdBytes = [...password].map(c => c.charCodeAt(0));
  console.log("[mobile-token] hit — email:", email, "| pwd bytes:", pwdBytes);

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // Demo mode — strip ALL whitespace/punctuation auto-added by mobile keyboards
  const pwdClean = password.replace(/[\s.,!?。，]/g, "");
  if (pwdClean === "demo123") {
    const iat = Math.floor(Date.now() / 1000);
    const token = signToken({ sub: "demo", email, name: "Demo User", iat, exp: iat + EXPIRY });
    return NextResponse.json({ token, user: { id: "demo", email, name: "Demo User" } });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

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
    console.error("[mobile-token] DB error:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
