/**
 * NextAuth v5 (Auth.js) configuration.
 *
 * Providers:
 *   Credentials — checks the `users` table in Neon DB;
 *                 falls back to demo mode (any email + "demo123") when no DB.
 *   GitHub      — requires AUTH_GITHUB_ID + AUTH_GITHUB_SECRET
 *   Google      — requires AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET
 *
 * Session strategy: JWT (no adapter required).
 */
import NextAuth, { type DefaultSession } from "next-auth";
import GitHub      from "next-auth/providers/github";
import Google      from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { getDb }          from "@/lib/db";
import { verifyPassword } from "@/lib/auth-crypto";

// ── Extend session so user.id is available in client components ───────────
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// ── Helper: derive a display name from an email local-part ────────────────
function nameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Provider list ─────────────────────────────────────────────────────────
const providers = [
  Credentials({
    name: "Email & Password",
    credentials: {
      email:    { label: "Email",    type: "email"    },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email    = (credentials?.email    as string | undefined)?.toLowerCase().trim();
      const password =  credentials?.password as string | undefined;
      if (!email || !password) return null;

      const sql = getDb();

      // ── DB mode: look up the user and verify password ───────────────────
      if (sql) {
        try {
          const rows = (await sql`
            SELECT id, name, email, password_hash
            FROM   users
            WHERE  email = ${email}
          `) as Array<{ id: string; name: string; email: string; password_hash: string }>;

          if (rows.length > 0) {
            const user = rows[0];
            const ok   = verifyPassword(password, user.password_hash);
            if (!ok) return null;
            return { id: user.id, name: user.name, email: user.email, image: null };
          }
        } catch (err) {
          console.error("[auth] DB lookup failed:", err);
          // Fall through to demo mode if DB is unavailable
        }
      }

      // ── Demo / no-DB fallback: any email + "demo123" ───────────────────
      if (password === "demo123") {
        return {
          id:    `demo-${Buffer.from(email).toString("base64")}`,
          name:  nameFromEmail(email),
          email,
          image: null,
        };
      }

      return null;
    },
  }),

  // OAuth — optional; only added when env vars are present
  ...(process.env.AUTH_GITHUB_ID
    ? [GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET! })]
    : []),
  ...(process.env.AUTH_GOOGLE_ID
    ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET! })]
    : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
});
