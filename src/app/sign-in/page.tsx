"use client";

/**
 * /sign-in — Unified auth page.
 *
 * Modern design: animated gradient background, glassmorphism card,
 * Sign In / Create Account tabs, password strength meter.
 */
import { useState, useTransition, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight,
  CheckCircle2, TrendingUp, Zap, Shield, BarChart2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Inline SVG brand icons ─────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

// ── Password strength ─────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const len   = password.length;
  const score = len < 6 ? 1 : len < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#f85149", "#d29922", "#58a6ff", "#3fb950"];
  return (
    <div className="space-y-1 pt-0.5">
      <div className="flex gap-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <p className="text-[10px] font-medium transition-colors" style={{ color: colors[score] }}>
        {labels[score]}
      </p>
    </div>
  );
}

// ── Reusable input field ──────────────────────────────────────────────────
function InputField({
  label, type = "text", value, onChange, placeholder,
  icon: Icon, autoComplete, rightEl,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  icon: React.ElementType; autoComplete?: string;
  rightEl?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">
        {label}
      </label>
      <div className="relative group">
        <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none" />
        <input
          type={type} value={value} autoComplete={autoComplete}
          placeholder={placeholder} required
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-white/5 text-sm text-[var(--foreground)] placeholder:text-white/20 focus:outline-none focus:border-[var(--accent)] focus:bg-white/8 transition-all"
        />
        {rightEl}
      </div>
    </div>
  );
}

// ── Password field ────────────────────────────────────────────────────────
function PasswordInput({
  label, value, onChange, autoComplete, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  autoComplete?: string; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <InputField
      label={label} type={show ? "text" : "password"} value={value}
      onChange={onChange} icon={Lock} autoComplete={autoComplete}
      placeholder={placeholder}
      rightEl={
        <button type="button" tabIndex={-1}
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      }
    />
  );
}

// ── Error box ─────────────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 text-xs text-[var(--red)] bg-[rgba(248,81,73,0.1)] border border-[rgba(248,81,73,0.25)] rounded-xl px-3.5 py-3">
      <span className="shrink-0 mt-0.5">⚠</span>
      <span>{msg}</span>
    </div>
  );
}

// ── Sign-In form ──────────────────────────────────────────────────────────
function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [email,     setEmail]    = useState("");
  const [password,  setPassword] = useState("");
  const [error,     setError]    = useState<string | null>(null);
  const [isPending, start]       = useTransition();

  const hasGitHub = process.env.NEXT_PUBLIC_HAS_GITHUB === "true";
  const hasGoogle = process.env.NEXT_PUBLIC_HAS_GOOGLE === "true";
  const hasOAuth  = hasGitHub || hasGoogle;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Incorrect email or password. Demo: any email + password demo123");
      } else {
        window.location.href = callbackUrl;
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasOAuth && (
        <>
          <div className={cn("grid gap-2", hasGitHub && hasGoogle ? "grid-cols-2" : "grid-cols-1")}>
            {hasGitHub && (
              <button type="button" disabled={isPending}
                onClick={() => start(async () => { await signIn("github", { callbackUrl }); })}
                className="flex items-center justify-center gap-2 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all disabled:opacity-50">
                <GitHubIcon /> GitHub
              </button>
            )}
            {hasGoogle && (
              <button type="button" disabled={isPending}
                onClick={() => start(async () => { await signIn("google", { callbackUrl }); })}
                className="flex items-center justify-center gap-2 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all disabled:opacity-50">
                <GoogleIcon /> Google
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] text-[var(--muted)]">or continue with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
        </>
      )}

      <InputField label="Email" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" icon={Mail} autoComplete="email" />

      <PasswordInput label="Password" value={password} onChange={setPassword}
        autoComplete="current-password" />

      {error && <ErrorBox msg={error} />}

      <button type="submit" disabled={isPending}
        className={cn(
          "w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
          "bg-[var(--accent)] text-white hover:brightness-110 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/20"
        )}>
        {isPending
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
          : <><span>Sign in</span><ArrowRight size={14} /></>
        }
      </button>

      {/* Demo hint */}
      <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-[11px] text-[var(--muted)] text-center space-y-1">
        <p className="font-medium text-[var(--foreground)/70]">Demo account</p>
        <p>Any email address · Password:{" "}
          <button type="button" className="font-mono text-[var(--accent)] hover:underline"
            onClick={() => { setEmail("demo@tradeai.app"); setPassword("demo123"); }}>
            demo123
          </button>
        </p>
      </div>
    </form>
  );
}

// ── Register form ─────────────────────────────────────────────────────────
function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);
  const [isPending, start]      = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }

    start(async () => {
      const res  = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Registration failed."); return; }

      const si = await signIn("credentials", { email, password, redirect: false });
      if (si?.error) {
        router.push(`/sign-in?registered=1&email=${encodeURIComponent(email)}`);
        return;
      }
      setDone(true);
      setTimeout(() => { window.location.href = callbackUrl; }, 1200);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[rgba(63,185,80,0.15)] border border-[rgba(63,185,80,0.3)] flex items-center justify-center">
          <CheckCircle2 size={28} className="text-[var(--green)]" />
        </div>
        <div>
          <p className="font-semibold text-base">Account created!</p>
          <p className="text-sm text-[var(--muted)] mt-1">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField label="Full name" value={name} onChange={setName}
        placeholder="Alex Smith" icon={User} autoComplete="name" />
      <InputField label="Email" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" icon={Mail} autoComplete="email" />
      <div className="space-y-1">
        <PasswordInput label="Password" value={password} onChange={setPassword}
          autoComplete="new-password" placeholder="At least 6 characters" />
        <PasswordStrength password={password} />
      </div>
      <PasswordInput label="Confirm password" value={confirm} onChange={setConfirm}
        autoComplete="new-password" placeholder="Repeat your password" />
      {error && <ErrorBox msg={error} />}
      <button type="submit" disabled={isPending}
        className={cn(
          "w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
          "bg-[var(--accent)] text-white hover:brightness-110 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/20"
        )}>
        {isPending
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
          : <><span>Create account</span><ArrowRight size={14} /></>
        }
      </button>
      <p className="text-center text-[10px] text-[var(--muted)]">
        Paper trading only · no real funds at risk
      </p>
    </form>
  );
}

// ── Animated background orbs ──────────────────────────────────────────────
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-[#060a10]" />
      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      {/* Glowing orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[var(--accent)] opacity-[0.07] blur-[120px] animate-orb-1" />
      <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full bg-purple-500 opacity-[0.05] blur-[100px] animate-orb-2" />
      <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-[var(--green)] opacity-[0.04] blur-[100px] animate-orb-3" />
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 text-center py-3 px-2 rounded-xl bg-white/5 border border-white/8">
      <p className="text-base font-bold text-[var(--accent)]">{value}</p>
      <p className="text-[10px] text-[var(--muted)] mt-0.5">{label}</p>
    </div>
  );
}

// ── Inner (needs useSearchParams → wrapped in Suspense) ───────────────────
function AuthInner() {
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const registered  = params.get("registered") === "1";
  const initTab     = params.get("tab") === "register" ? "register" : "signin";

  const [tab, setTab] = useState<"signin" | "register">(registered ? "signin" : initTab);

  const FEATURES = [
    { icon: TrendingUp, text: "Real-time prices across 21+ assets" },
    { icon: BarChart2,  text: "6 institutional-grade strategies"    },
    { icon: Zap,        text: "AI-powered market analysis"          },
    { icon: Shield,     text: "100% paper trading — zero risk"      },
  ];

  return (
    <div className="relative min-h-screen flex">
      <Background />

      {/* ── Left panel (desktop) ───────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 p-12 border-r border-white/6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
            <Activity size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">TradeAI</span>
        </div>

        {/* Headline */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Professional<br />
              trading,{" "}
              <span className="text-[var(--accent)]">reimagined.</span>
            </h1>
            <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed max-w-xs">
              Multi-asset paper trading with real-time market data,
              AI analysis, and six institutional-grade strategies.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(88,166,255,0.1)] border border-[rgba(88,166,255,0.15)] flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-[var(--accent)]" />
                </div>
                <span className="text-sm text-white/70">{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="flex gap-3">
            <Stat value="21+" label="Assets" />
            <Stat value="6"   label="Strategies" />
            <Stat value="$25k" label="Paper funds" />
          </div>
        </div>

        <p className="text-[11px] text-[var(--muted)]">
          © {new Date().getFullYear()} TradeAI · Paper trading only
        </p>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">TradeAI</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-2xl p-7 space-y-6"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 32px 64px -16px rgba(0,0,0,0.6)" }}>

            {/* Registered banner */}
            {registered && (
              <div className="flex items-center gap-2 text-sm text-[var(--green)] bg-[rgba(63,185,80,0.08)] border border-[rgba(63,185,80,0.2)] rounded-xl px-4 py-3">
                <CheckCircle2 size={15} className="shrink-0" />
                Account created — sign in to continue.
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex rounded-xl border border-white/10 overflow-hidden bg-white/4 p-0.5 gap-0.5">
              {(["signin", "register"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 py-2 text-sm font-semibold rounded-[9px] transition-all duration-200",
                    tab === t
                      ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/25"
                      : "text-[var(--muted)] hover:text-white"
                  )}>
                  {t === "signin" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-lg font-bold text-white">
                {tab === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                {tab === "signin"
                  ? "Sign in to access your dashboard."
                  : "Start paper trading in 30 seconds."}
              </p>
            </div>

            {/* Form */}
            {tab === "signin"
              ? <SignInForm callbackUrl={callbackUrl} />
              : <RegisterForm callbackUrl={callbackUrl} />
            }

            {/* Footer toggle */}
            <p className="text-center text-xs text-[var(--muted)] pt-1">
              {tab === "signin" ? (
                <>No account yet?{" "}
                  <button onClick={() => setTab("register")}
                    className="text-[var(--accent)] font-semibold hover:underline">
                    Create one free →
                  </button>
                </>
              ) : (
                <>Have an account?{" "}
                  <button onClick={() => setTab("signin")}
                    className="text-[var(--accent)] font-semibold hover:underline">
                    Sign in →
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Animations (injected once) ────────────────────────────────────────────
const ORB_STYLES = `
  @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(60px,40px) scale(1.1)} }
  @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,60px) scale(0.9)} }
  @keyframes orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-50px) scale(1.05)} }
  .animate-orb-1 { animation: orb1 12s ease-in-out infinite; }
  .animate-orb-2 { animation: orb2 15s ease-in-out infinite; }
  .animate-orb-3 { animation: orb3 18s ease-in-out infinite; }
`;

// ── Page export ────────────────────────────────────────────────────────────
export default function AuthPage() {
  return (
    <>
      <style>{ORB_STYLES}</style>
      <Suspense fallback={
        <div className="min-h-screen bg-[#060a10] flex items-center justify-center">
          <span className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      }>
        <AuthInner />
      </Suspense>
    </>
  );
}
