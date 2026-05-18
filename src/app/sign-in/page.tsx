"use client";

/**
 * /sign-in — Unified authentication page.
 *
 * Two tabs: "Sign In" and "Create Account".
 * Left panel shows branding on desktop (lg+), right panel shows the form.
 *
 * Sign-in  → NextAuth credentials or OAuth.
 * Register → POST /api/auth/register, then auto-sign-in.
 */
import { useState, useTransition, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, TrendingUp, Zap, Shield, BarChart2, User, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Brand icons ────────────────────────────────────────────────────────────
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

// ── Field input with icon ──────────────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, icon: Icon,
  autoComplete, required = true,
  rightEl,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  icon: React.ElementType; autoComplete?: string;
  required?: boolean; rightEl?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--muted)]">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
        <input
          type={type} value={value} required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 pl-9 pr-10 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        {rightEl && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</span>
        )}
      </div>
    </div>
  );
}

// ── Password field helper ──────────────────────────────────────────────────
function PasswordField({
  label, value, onChange, autoComplete, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  autoComplete?: string; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={label} type={show ? "text" : "password"} value={value}
      onChange={onChange} icon={Lock} autoComplete={autoComplete}
      placeholder={placeholder}
      rightEl={
        <button type="button" tabIndex={-1}
          onClick={() => setShow(!show)}
          className="text-[var(--muted)] hover:text-[var(--foreground)]">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      }
    />
  );
}

// ── Error message ─────────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <p className="text-xs text-[var(--red)] bg-[rgba(248,81,73,0.08)] border border-[rgba(248,81,73,0.2)] rounded-lg px-3 py-2 leading-relaxed">
      {msg}
    </p>
  );
}

// ── Password strength bar ─────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const len   = password.length;
  const score = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "var(--red)", "#f0a500", "#58a6ff", "var(--green)"];
  if (!password) return null;
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-colors duration-300"
            style={{ background: i <= score ? colors[score] : "var(--surface-2)" }} />
        ))}
      </div>
      <p className="text-[10px]" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  );
}

// ── Sign-In form ──────────────────────────────────────────────────────────
function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasGitHub = process.env.NEXT_PUBLIC_HAS_GITHUB === "true";
  const hasGoogle = process.env.NEXT_PUBLIC_HAS_GOOGLE === "true";
  const hasOAuth  = hasGitHub || hasGoogle;

  function oauthSignIn(provider: "github" | "google") {
    startTransition(async () => {
      try { await signIn(provider, { callbackUrl }); }
      catch { setError("OAuth sign-in failed. Check provider configuration."); }
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Incorrect email or password. Try demo123 for the demo account.");
      } else {
        window.location.href = callbackUrl;
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* OAuth buttons */}
      {hasOAuth && (
        <>
          <div className="grid gap-2" style={{ gridTemplateColumns: hasGitHub && hasGoogle ? "1fr 1fr" : "1fr" }}>
            {hasGitHub && (
              <button type="button" onClick={() => oauthSignIn("github")} disabled={isPending}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm font-medium hover:bg-[var(--surface)] transition-colors disabled:opacity-50">
                <GitHubIcon /> GitHub
              </button>
            )}
            {hasGoogle && (
              <button type="button" onClick={() => oauthSignIn("google")} disabled={isPending}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-sm font-medium hover:bg-[var(--surface)] transition-colors disabled:opacity-50">
                <GoogleIcon /> Google
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[11px] text-[var(--muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
        </>
      )}

      <Field label="Email" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" icon={Mail} autoComplete="email" />

      <PasswordField label="Password" value={password} onChange={setPassword}
        autoComplete="current-password" />

      {error && <ErrorBox msg={error} />}

      <button type="submit" disabled={isPending}
        className={cn(
          "w-full h-10 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
          "bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}>
        {isPending ? "Signing in…" : <><span>Sign in</span><ArrowRight size={14} /></>}
      </button>

      {/* Demo hint */}
      <p className="text-center text-[11px] text-[var(--muted)]">
        Demo: any email ·{" "}
        <button type="button" className="font-mono text-[var(--accent)] hover:underline"
          onClick={() => { setEmail("demo@tradeai.app"); setPassword("demo123"); }}>
          fill demo credentials
        </button>
      </p>
    </form>
  );
}

// ── Register form ─────────────────────────────────────────────────────────
function RegisterForm({ callbackUrl, onSuccess }: { callbackUrl: string; onSuccess?: () => void }) {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      // 1. Register
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // 2. Auto-sign in with credentials
      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        // Registered OK but sign-in failed — redirect to sign-in page
        router.push(`/sign-in?registered=1&email=${encodeURIComponent(email)}`);
        return;
      }

      setDone(true);
      setTimeout(() => { window.location.href = callbackUrl; }, 1200);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[rgba(63,185,80,0.12)] flex items-center justify-center">
          <CheckCircle2 size={24} className="text-[var(--green)]" />
        </div>
        <p className="font-semibold">Account created!</p>
        <p className="text-sm text-[var(--muted)]">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Full name" value={name} onChange={setName}
        placeholder="Alex Smith" icon={User} autoComplete="name" />

      <Field label="Email" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" icon={Mail} autoComplete="email" />

      <div className="space-y-1">
        <PasswordField label="Password" value={password} onChange={setPassword}
          autoComplete="new-password" placeholder="Min. 6 characters" />
        <PasswordStrength password={password} />
      </div>

      <PasswordField label="Confirm password" value={confirm} onChange={setConfirm}
        autoComplete="new-password" placeholder="Repeat your password" />

      {error && <ErrorBox msg={error} />}

      <button type="submit" disabled={isPending}
        className={cn(
          "w-full h-10 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
          "bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}>
        {isPending ? "Creating account…" : <><span>Create account</span><ArrowRight size={14} /></>}
      </button>

      <p className="text-center text-[11px] text-[var(--muted)]">
        By registering you agree to use this platform for paper trading only.
      </p>
    </form>
  );
}

// ── Features list (left panel) ────────────────────────────────────────────
const FEATURES = [
  { icon: TrendingUp, text: "Real-time multi-asset quotes" },
  { icon: BarChart2,  text: "6 professional trading strategies" },
  { icon: Zap,        text: "AI-powered market analysis"       },
  { icon: Shield,     text: "Paper trading — no real money"    },
];

// ── Inner component (needs useSearchParams → must be in Suspense) ─────────
function AuthPageInner() {
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const initEmail   = params.get("email") ?? "";
  const registered  = params.get("registered") === "1";
  const initTab     = params.get("tab") === "register" ? "register" : "signin";

  // Tab: "signin" | "register"
  const [tab, setTab] = useState<"signin" | "register">(registered ? "signin" : initTab);

  return (
    <div className="min-h-screen bg-[var(--background)] flex">

      {/* ── Left panel — branding (desktop only) ─────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-[var(--surface)] border-r border-[var(--border)] p-10 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white font-bold text-base">T</span>
          </div>
          <span className="font-bold text-lg tracking-tight">TradeAI</span>
        </div>

        {/* Copy */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Professional trading.<br />
              <span className="text-[var(--accent)]">AI-powered insights.</span>
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
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
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Assets", value: "21+" },
              { label: "Strategies", value: "6" },
              { label: "Paper $", value: "$25k" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <p className="text-lg font-bold text-[var(--accent)]">{value}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[var(--muted)]">Paper trading only · no real funds at risk</p>
      </div>

      {/* ── Right panel — auth form ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-base tracking-tight">TradeAI</span>
          </div>

          {/* Registered banner */}
          {registered && (
            <div className="mb-4 flex items-center gap-2 text-sm text-[var(--green)] bg-[rgba(63,185,80,0.08)] border border-[rgba(63,185,80,0.2)] rounded-xl px-4 py-3">
              <CheckCircle2 size={15} className="shrink-0" />
              Account created — please sign in.
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex rounded-xl border border-[var(--border)] overflow-hidden mb-6 bg-[var(--surface-2)]">
            {(["signin", "register"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold transition-colors",
                  tab === t
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}>
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-xl font-bold">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              {tab === "signin"
                ? "Sign in to access your trading dashboard."
                : "Join TradeAI and start paper trading today."}
            </p>
          </div>

          {/* Form */}
          {tab === "signin"
            ? <SignInForm callbackUrl={callbackUrl} />
            : <RegisterForm callbackUrl={callbackUrl} />
          }

          {/* Footer link */}
          <p className="text-center text-xs text-[var(--muted)] mt-5">
            {tab === "signin" ? (
              <>Don&rsquo;t have an account?{" "}
                <button onClick={() => setTab("register")}
                  className="text-[var(--accent)] font-medium hover:underline">
                  Create one free
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setTab("signin")}
                  className="text-[var(--accent)] font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    }>
      <AuthPageInner />
    </Suspense>
  );
}
