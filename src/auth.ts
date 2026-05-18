/**
 * NextAuth v5 (Auth.js) configuration.
 *
 * Providers:
 *   Google  — requires AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET
 *   GitHub  — requires AUTH_GITHUB_ID + AUTH_GITHUB_SECRET
 *   Demo    — any email + password "demo123" (no env vars needed)
 *
 * Session strategy: JWT (no database adapter required).
 * User data is encoded in the signed JWT; the DB stores portfolio/orders.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// ── Extend session type to surface user.id in client components ────────────
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// ── Build provider list — OAuth providers are optional ─────────────────────
const providers = [
  // Demo / credentials — always available (no env vars needed)
  Credentials({
    name: "Demo Account",
    credentials: {
      email:    { label: "Email",    type: "email",    placeholder: "you@example.com" },
      password: { label: "Password", type: "password", placeholder: "demo123" },
    },
    async authorize(credentials) {
      const email    = credentials?.email    as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      // Demo gate: any valid email + the shared demo password
      if (password === "demo123") {
        return {
          id:    `demo-${Buffer.from(email).toString("base64")}`,
          name:  email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          email,
          image: null,
        };
      }
      return null;
    },
  }),

  // OAuth providers — added only when env vars are present so the app works
  // without an OAuth app configured during local development.
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
    // Persist provider user.id into the JWT
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    // Expose user.id in the session object client-side
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
});
