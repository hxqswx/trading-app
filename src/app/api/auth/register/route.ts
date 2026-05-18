/**
 * POST /api/auth/register
 *
 * Creates a new user account with an email + hashed password.
 * When no DATABASE_URL is set the route runs in "demo mode" and returns
 * a synthetic success so the client can sign in via demo credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { DDL } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth-crypto";

export const runtime = "nodejs";

// Basic server-side email validator (avoids adding a dep)
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email = "", password = "", name = "" } = body;

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!name.trim() || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const sql = getDb();

  // ── No-DB mode ─────────────────────────────────────────────────────────────
  // When DATABASE_URL is not set we accept any registration and tell the client
  // to sign in with the demo password. The "account" lives only in the JWT.
  if (!sql) {
    return NextResponse.json({
      ok:    true,
      demo:  true,
      message: "Demo mode — no database connected. Sign in with any email and password 'demo123'.",
    });
  }

  // ── DB mode ────────────────────────────────────────────────────────────────
  try {
    // Ensure schema exists (idempotent)
    await sql.query(DDL);

    // Check for duplicate email
    const existing = (await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}
    `) as Array<{ id: string }>;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Hash and store
    const passwordHash = hashPassword(password);
    const displayName  = name.trim();

    await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email.toLowerCase().trim()}, ${displayName}, ${passwordHash})
    `;

    return NextResponse.json({ ok: true, demo: false });
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
