"use client";

/**
 * /sign-in  ·  Landing + Auth page.
 *
 * Layout:
 *   Desktop (lg+) — left 55% hero  |  right 45% auth card
 *   Mobile        — hero at top    →  auth card below
 *
 * Visual elements:
 *   • Animated background: dark navy + 50px dot-grid + 3 drifting glow orbs
 *   • Logo mark with pulse rings and gradient glow shadow
 *   • Self-drawing SVG price-chart with gradient area fill
 *   • Floating stat cards & feature badges
 *   • Glassmorphism auth card with Sign In / Register tabs
 */
import { useState, useTransition, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2,
  TrendingUp, Zap, Shield, Activity, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════ VISUAL ATOMS ══

/** Google OAuth icon */
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

/** GitHub OAuth icon */
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════ HERO PIECES ══

/** Animated logo mark with pulsing glow rings */
function LogoMark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-16 h-16" : "w-10 h-10";
  const ico = size === "lg" ? 30 : 18;
  return (
    <div className="relative flex items-center justify-center shrink-0">
      {/* Outer pulse ring */}
      <div className={cn(
        "absolute rounded-2xl border border-[#58a6ff]/30",
        size === "lg" ? "w-20 h-20 animate-logo-pulse" : "w-14 h-14 animate-logo-pulse-sm"
      )} />
      {/* Inner pulse ring */}
      <div className={cn(
        "absolute rounded-2xl border border-[#58a6ff]/15",
        size === "lg" ? "w-24 h-24 animate-logo-pulse-delay" : "w-16 h-16"
      )} />
      {/* Icon container */}
      <div className={cn(
        dim,
        "relative rounded-2xl flex items-center justify-center z-10",
        "bg-gradient-to-br from-[#58a6ff] via-[#3b82f6] to-[#6366f1]",
        "shadow-[0_0_30px_rgba(88,166,255,0.5),0_0_60px_rgba(88,166,255,0.2)]"
      )}>
        <TrendingUp size={ico} className="text-white" strokeWidth={2.5} />
      </div>
    </div>
  );
}

/** Self-drawing rising SVG chart with gradient fill */
function AnimatedChart() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 300);
    return () => clearTimeout(t);
  }, []);

  // A rising line with a realistic jagged path
  const line = "M0,72 L18,62 L36,67 L54,52 L72,57 L90,40 L108,45 L126,28 L144,33 L162,18 L180,22 L198,12 L216,16 L234,6 L252,9 L270,4";
  const area = `${line} L270,90 L0,90 Z`;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/6 bg-white/3 p-4">
      {/* Top row: fake ticker */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">BTC / USD</span>
          <span className="text-[10px] text-white/40 bg-white/6 px-2 py-0.5 rounded-full">1D</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold font-mono text-white">$67,840</p>
          <p className="text-[10px] font-mono text-[#3fb950]">▲ +4.23%</p>
        </div>
      </div>

      {/* Chart SVG */}
      <svg viewBox="0 0 270 90" className="w-full h-20" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#58a6ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={area} fill="url(#areaFill)" />
        {/* Line — draws itself via dashoffset transition */}
        <path
          d={line} fill="none" stroke="#58a6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            strokeDasharray: 800,
            strokeDashoffset: drawn ? 0 : 800,
            transition: drawn ? "stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)" : "none",
          }}
        />
        {/* End dot */}
        {drawn && <circle cx="270" cy="4" r="4" fill="#58a6ff" className="drop-shadow-[0_0_6px_#58a6ff]" />}
      </svg>
    </div>
  );
}

/** Animated counting number */
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const duration = 1200;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target]);
  return <>{val}{suffix}</>;
}

/** Stat card */
function StatCard({ value, suffix = "", label, icon: Icon, color }: {
  value: number; suffix?: string; label: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-white/8 bg-white/4 p-3 text-center backdrop-blur-sm">
      <div className="flex items-center justify-center mb-1">
        <Icon size={12} style={{ color }} />
      </div>
      <p className="text-xl font-black font-mono" style={{ color }}>
        <CountUp target={value} suffix={suffix} />
      </p>
      <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
    </div>
  );
}

/** Feature badge pill */
function Badge({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
      style={{ borderColor: `${color}30`, backgroundColor: `${color}10`, color }}>
      <Icon size={11} />
      {label}
    </div>
  );
}

/** Drifting background orbs + grid */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050a13]">
      {/* Dot grid */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
      {/* Radial vignette */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-[#050a13]/60 to-[#050a13]" />
      {/* Orbs */}
      <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full blur-[140px] animate-orb-a"
        style={{ background: "radial-gradient(circle, rgba(88,166,255,0.12) 0%, transparent 70%)" }} />
      <div className="absolute top-1/3 -right-48 w-[600px] h-[600px] rounded-full blur-[120px] animate-orb-b"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] animate-orb-c"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════ FORM ATOMS ══

function PasswordStrength({ pw }: { pw: string }) {
  if (!pw) return null;
  const s = pw.length < 6 ? 1 : pw.length < 10 ? 2 : /[A-Z]/.test(pw) && /\d/.test(pw) ? 4 : 3;
  const cols = ["", "#f85149", "#d29922", "#58a6ff", "#3fb950"];
  const labs = ["", "Weak", "Fair", "Good", "Strong"];
  return (
    <div className="space-y-1 pt-0.5">
      <div className="flex gap-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
            style={{ background: i <= s ? cols[s] : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <p className="text-[10px]" style={{ color: cols[s] }}>{labs[s]}</p>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, icon: Icon, autoComplete, rightEl }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon: React.ElementType; autoComplete?: string; rightEl?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <Icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-[#58a6ff] transition-colors pointer-events-none" />
        <input type={type} value={value} required autoComplete={autoComplete} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/8 bg-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#58a6ff]/60 focus:bg-white/8 transition-all" />
        {rightEl}
      </div>
    </div>
  );
}

function PwField({ label, value, onChange, autoComplete, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; autoComplete?: string; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} type={show ? "text" : "password"} value={value} onChange={onChange}
      icon={Lock} autoComplete={autoComplete} placeholder={placeholder}
      rightEl={
        <button type="button" tabIndex={-1} onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/70 transition-colors">
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      } />
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 text-xs text-[#f85149] bg-[rgba(248,81,73,0.08)] border border-[rgba(248,81,73,0.2)] rounded-xl px-3.5 py-3">
      <span className="shrink-0">⚠</span><span>{msg}</span>
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />;
}

// ═══════════════════════════════════════════════════════════ AUTH FORMS ══

function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [pending, go]           = useTransition();

  const hasGH  = process.env.NEXT_PUBLIC_HAS_GITHUB === "true";
  const hasGOO = process.env.NEXT_PUBLIC_HAS_GOOGLE === "true";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    go(async () => {
      const r = await signIn("credentials", { email, password, redirect: false });
      if (r?.error) setError("Incorrect email or password. Demo: any email + demo123");
      else window.location.href = callbackUrl;
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {(hasGH || hasGOO) && (
        <>
          <div className={cn("grid gap-2", hasGH && hasGOO ? "grid-cols-2" : "grid-cols-1")}>
            {hasGH  && <OAuthBtn icon={<GitHubIcon />} label="GitHub" onClick={() => go(async () => signIn("github",  { callbackUrl }))} disabled={pending} />}
            {hasGOO && <OAuthBtn icon={<GoogleIcon />} label="Google" onClick={() => go(async () => signIn("google",  { callbackUrl }))} disabled={pending} />}
          </div>
          <Divider text="or continue with email" />
        </>
      )}
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />
      <PwField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
      {error && <Err msg={error} />}
      <SubmitBtn pending={pending} label="Sign in" />
      {/* Demo hint */}
      <div className="rounded-xl border border-white/6 bg-white/3 px-4 py-3 text-[11px] text-center text-white/40">
        <span className="font-medium text-white/60">Demo account</span> — any email ·{" "}
        <button type="button" className="text-[#58a6ff] hover:underline font-mono"
          onClick={() => { setEmail("demo@tradeai.app"); setPassword("demo123"); }}>
          fill demo credentials
        </button>
      </div>
    </form>
  );
}

function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [pw, setPw]             = useState("");
  const [pw2, setPw2]           = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);
  const [pending, go]           = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (pw !== pw2)  { setError("Passwords do not match."); return; }
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    go(async () => {
      const res  = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password: pw }) });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error ?? "Registration failed."); return; }
      const si = await signIn("credentials", { email, password: pw, redirect: false });
      if (si?.error) { router.push(`/sign-in?registered=1&email=${encodeURIComponent(email)}`); return; }
      setDone(true);
      setTimeout(() => { window.location.href = callbackUrl; }, 1200);
    });
  }

  if (done) return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="w-14 h-14 rounded-full bg-[rgba(63,185,80,0.12)] border border-[rgba(63,185,80,0.25)] flex items-center justify-center">
        <CheckCircle2 size={28} className="text-[#3fb950]" />
      </div>
      <div><p className="font-semibold text-base">Account created!</p><p className="text-xs text-white/40 mt-1">Redirecting to your dashboard…</p></div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full name" value={name} onChange={setName} placeholder="Alex Smith" icon={User} autoComplete="name" />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />
      <div className="space-y-1">
        <PwField label="Password" value={pw} onChange={setPw} autoComplete="new-password" placeholder="At least 6 characters" />
        <PasswordStrength pw={pw} />
      </div>
      <PwField label="Confirm password" value={pw2} onChange={setPw2} autoComplete="new-password" placeholder="Repeat your password" />
      {error && <Err msg={error} />}
      <SubmitBtn pending={pending} label="Create account" />
      <p className="text-center text-[10px] text-white/30">Paper trading only · no real funds at risk</p>
    </form>
  );
}

// ── Shared small components ────────────────────────────────────────────────
function OAuthBtn({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex items-center justify-center gap-2 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all disabled:opacity-50">
      {icon} {label}
    </button>
  );
}
function Divider({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-white/8" /><span className="text-[10px] text-white/30">{text}</span><div className="flex-1 h-px bg-white/8" />
    </div>
  );
}
function SubmitBtn({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending}
      className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#58a6ff] text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#58a6ff]/25">
      {pending ? <><Spinner />{label.replace("Sign", "Signing").replace("Create", "Creating")}…</> : <>{label} <ArrowRight size={14} /></>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════ MAIN PAGE ══

const PAGE_STYLES = `
  @keyframes orbA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(80px,50px) scale(1.15)} }
  @keyframes orbB { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-60px,80px) scale(0.88)} }
  @keyframes orbC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-60px) scale(1.08)} }
  @keyframes logoPulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  @keyframes logoPulseSm{ 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.04)} }
  @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .animate-orb-a { animation: orbA 14s ease-in-out infinite; }
  .animate-orb-b { animation: orbB 18s ease-in-out infinite; }
  .animate-orb-c { animation: orbC 22s ease-in-out infinite; }
  .animate-logo-pulse { animation: logoPulse 2.4s ease-in-out infinite; }
  .animate-logo-pulse-delay { animation: logoPulseSm 2.4s ease-in-out infinite 0.8s; }
  .animate-float { animation: floatUp 4s ease-in-out infinite; }
  .animate-float-late { animation: floatUp 4s ease-in-out infinite 1.3s; }
`;

function AuthInner() {
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const registered  = params.get("registered") === "1";
  const initTab     = params.get("tab") === "register" ? "register" : "signin";
  const [tab, setTab] = useState<"signin" | "register">(registered ? "signin" : initTab);

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      <style>{PAGE_STYLES}</style>
      <Background />

      {/* ══════════════ LEFT — HERO ══════════════ */}
      <div className="flex flex-col justify-between lg:w-[58%] px-8 pt-10 pb-8 lg:px-14 lg:pt-14 lg:pb-12">

        {/* Logo wordmark */}
        <div className="flex items-center gap-3">
          <LogoMark size="sm" />
          <div>
            <span className="font-black text-xl tracking-tight text-white">TradeAI</span>
            <span className="ml-2 text-[10px] font-bold text-[#58a6ff] bg-[rgba(88,166,255,0.12)] px-2 py-0.5 rounded-full border border-[rgba(88,166,255,0.2)]">BETA</span>
          </div>
        </div>

        {/* ── Hero content (grows to fill) */}
        <div className="flex-1 flex flex-col justify-center py-12 lg:py-0 max-w-xl">

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge icon={Activity} label="Real-time Data"   color="#3fb950" />
            <Badge icon={Zap}      label="AI Analysis"      color="#58a6ff" />
            <Badge icon={Shield}   label="Paper Trading"    color="#a855f7" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white mb-5">
            Trade the<br />
            markets like<br />
            <span style={{
              background: "linear-gradient(135deg, #58a6ff 0%, #818cf8 40%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              a professional.
            </span>
          </h1>

          {/* Sub-text */}
          <p className="text-sm sm:text-base text-white/50 leading-relaxed mb-8 max-w-sm">
            Real-time quotes across crypto, stocks, and global markets.
            Six institutional-grade strategies. AI-powered signals.
            All risk-free with paper trading.
          </p>

          {/* Animated chart card */}
          <div className="animate-float">
            <AnimatedChart />
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-5 animate-float-late">
            <StatCard value={21} suffix="+"  label="Assets"     icon={Activity}   color="#58a6ff" />
            <StatCard value={6}              label="Strategies"  icon={TrendingUp}  color="#a855f7" />
            <StatCard value={25} suffix="K+" label="Paper $USD"  icon={Zap}        color="#3fb950" />
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/20 hidden lg:block">
          © {new Date().getFullYear()} TradeAI · Paper trading only · No real funds at risk
        </p>
      </div>

      {/* ══════════════ RIGHT — AUTH CARD ══════════════ */}
      <div className="flex items-center justify-center px-5 pb-10 lg:pb-0 lg:px-10 lg:w-[42%]">
        <div className="w-full max-w-[390px]">

          {/* Registered success banner */}
          {registered && (
            <div className="mb-4 flex items-center gap-2 text-sm text-[#3fb950] bg-[rgba(63,185,80,0.08)] border border-[rgba(63,185,80,0.2)] rounded-xl px-4 py-3">
              <CheckCircle2 size={15} className="shrink-0" />
              Account created — sign in to continue.
            </div>
          )}

          {/* Glass card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-7 space-y-6"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)" }}>

            {/* Card header */}
            <div>
              <h2 className="text-lg font-bold text-white">
                {tab === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-xs text-white/35 mt-1">
                {tab === "signin"
                  ? "Sign in to access your trading dashboard."
                  : "Join TradeAI and start paper trading today."}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl border border-white/8 bg-white/4 p-0.5 gap-0.5">
              {(["signin", "register"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 py-2 text-sm font-semibold rounded-[9px] transition-all duration-200",
                    tab === t
                      ? "bg-[#58a6ff] text-white shadow-md shadow-[#58a6ff]/30"
                      : "text-white/35 hover:text-white/70"
                  )}>
                  {t === "signin" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            {/* Form */}
            {tab === "signin"
              ? <SignInForm  callbackUrl={callbackUrl} />
              : <RegisterForm callbackUrl={callbackUrl} />
            }

            {/* Footer toggle */}
            <p className="text-center text-[11px] text-white/30">
              {tab === "signin"
                ? <>No account?{" "}<button onClick={() => setTab("register")} className="text-[#58a6ff] font-semibold hover:underline inline-flex items-center gap-0.5">Create one free <ChevronRight size={10} /></button></>
                : <>Have an account?{" "}<button onClick={() => setTab("signin")} className="text-[#58a6ff] font-semibold hover:underline inline-flex items-center gap-0.5">Sign in <ChevronRight size={10} /></button></>
              }
            </p>
          </div>

          {/* Trust line */}
          <p className="text-center text-[10px] text-white/20 mt-4">
            Secured with NextAuth · Zero real funds at risk
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050a13] flex items-center justify-center">
        <span className="w-9 h-9 rounded-full border-2 border-[#58a6ff] border-t-transparent animate-spin" />
      </div>
    }>
      <AuthInner />
    </Suspense>
  );
}
