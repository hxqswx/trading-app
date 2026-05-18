"use client";

/**
 * /sign-in — Authentication page.
 *
 * Renders OAuth buttons (GitHub, Google) when env vars are configured,
 * plus a demo credentials form (any email + password "demo123").
 * After successful sign-in the user is redirected to callbackUrl or "/".
 */
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Eye, EyeOff, TrendingUp, Zap, Shield, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Icons ──────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

// ── Feature bullets shown beside the form ─────────────────────────────────
const FEATURES = [
  { icon: TrendingUp, text: "Real-time multi-asset quotes" },
  { icon: BarChart2,  text: "6 professional trading strategies" },
  { icon: Zap,        text: "AI-powered market analysis" },
  { icon: Shield,     text: "Paper trading — no real money" },
];

// ── Inner form (needs useSearchParams, must be wrapped in Suspense) ────────
function SignInForm() {
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [email,     setEmail]     = useState("demo@tradeai.app");
  const [password,  setPassword]  = useState("demo123");
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── GitHub / Google OAuth ────────────────────────────────────────────────
  function oauthSignIn(provider: "github" | "google") {
    startTransition(async () => {
      try {
        await signIn(provider, { callbackUrl });
      } catch {
        setError("OAuth sign-in failed. Check provider configuration.");
      }
    });
  }

  // ── Credentials (demo) ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email, password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid credentials. Use password: demo123");
      } else {
        window.location.href = callbackUrl;
      }
    });
  }

  const hasGitHub = process.env.NEXT_PUBLIC_HAS_GITHUB === "true";
  const hasGoogle = process.env.NEXT_PUBLIC_HAS_GOOGLE === "true";
  const hasOAuth  = hasGitHub || hasGoogle;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* OAuth buttons */}
      {hasOAuth && (
        <>
          <div className="grid gap-2" style={{ gridTemplateColumns: hasGitHub && hasGoogle ? "1fr 1fr" : "1fr" }}>
            {hasGitHub && (
              <button type="button" onClick={() => oauthSignIn("github")} disabled={isPending}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--surface)] transition-colors disabled:opacity-50">
                <GitHubIcon /> GitHub
              </button>
            )}
            {hasGoogle && (
              <button type="button" onClick={() => oauthSignIn("google")} disabled={isPending}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--surface)] transition-colors disabled:opacity-50">
                <GoogleIcon /> Google
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[11px] text-[var(--muted)]">or continue with demo</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
        </>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--muted)]">Email</label>
        <input
          type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--muted)]">Password</label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"} required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 pr-10 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[var(--red)] bg-[rgba(248,81,73,0.08)] border border-[rgba(248,81,73,0.2)] rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <button type="submit" disabled={isPending}
        className={cn(
          "w-full h-10 rounded-lg font-medium text-sm transition-all",
          "bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}>
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      {/* Demo hint */}
      <p className="text-center text-[11px] text-[var(--muted)]">
        Demo account · any email · password:{" "}
        <button type="button" className="font-mono text-[var(--accent)] hover:underline"
          onClick={() => setPassword("demo123")}>
          demo123
        </button>
      </p>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* ── Left panel — branding (hidden on small screens) ───────────── */}
      <div className="hidden lg:flex flex-col justify-between w-96 bg-[var(--surface)] border-r border-[var(--border)] p-10 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white font-bold text-base">T</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">TradeAI</span>
        </div>

        {/* Feature list */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold leading-snug">
              Professional trading.<br />
              <span className="text-[var(--accent)]">AI-powered insights.</span>
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              Multi-asset paper trading with real-time market data, six institutional-grade
              strategies, and AI analysis — all in one place.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(88,166,255,0.1)] flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-[var(--accent)]" />
                </div>
                <span className="text-sm text-[var(--foreground)]">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-[var(--muted)]">
          Paper trading only · no real funds at risk
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold">TradeAI</span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-xl font-bold">Sign in</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Access your trading dashboard
            </p>
          </div>

          {/* Form (wrapped in Suspense for useSearchParams) */}
          <Suspense fallback={<div className="h-40 animate-pulse bg-[var(--surface)] rounded-xl" />}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
