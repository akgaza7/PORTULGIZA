import { useState } from "react";
import {
  Eye, EyeOff, User, Mail, Lock, Phone,
  ArrowLeft, ArrowRight, CheckCircle, X, Smile,
} from "lucide-react";
import { createAccount, loginUser } from "@/store/auth";
import { PT } from "@/lib/colors";

type View = "home" | "guest" | "portal";

interface Props {
  onComplete: () => void;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ── test-credential helpers ─────────────────────────────────────────────── */

const TEST_KEY = "portulgiza_test_creds";

interface TestCreds { name?: string; preferredName?: string; email?: string; password?: string; phone?: string }

function loadCreds(): TestCreds {
  try { const r = localStorage.getItem(TEST_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveCreds(c: TestCreds): void {
  try { localStorage.setItem(TEST_KEY, JSON.stringify({ ...loadCreds(), ...c })); } catch {}
}
function wipeCreds(): void {
  try { localStorage.removeItem(TEST_KEY); } catch {}
}

/* ── shared micro-components ─────────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {children}
    </label>
  );
}

function InputWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center border-2 border-slate-200 rounded-2xl bg-white focus-within:border-blue-400 transition-colors">
      {children}
    </div>
  );
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return <span className="absolute left-3.5 text-slate-400">{children}</span>;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p
      className="text-xs font-medium rounded-xl px-3 py-2.5 leading-snug"
      style={{ backgroundColor: PT.redBg, color: PT.red }}
    >
      {message}
    </p>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: PT.greenBg }}
    >
      <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: PT.green }} />
      <p className="text-xs font-medium leading-snug" style={{ color: PT.green }}>
        {message}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
  );
}

/* ── shared layout wrappers ──────────────────────────────────────────────── */

function Brand() {
  return (
    <div className="flex flex-col items-center mb-5">
      <div className="mb-3 shadow-xl rounded-2xl overflow-hidden" style={{ width: 66, height: 66 }}>
        <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-full h-full object-cover" />
      </div>
      <h1 className="text-xl font-extrabold tracking-tight text-slate-800">PORTULGIZA</h1>
      <p className="text-xs text-slate-400 mt-0.5">Language Learning</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 px-6 py-6 w-full max-w-sm">
      {children}
    </div>
  );
}

const inputCls =
  "w-full pl-9 pr-4 py-3 text-sm text-slate-800 bg-transparent rounded-2xl outline-none placeholder:text-slate-400";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  Main export                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function AuthScreen({ onComplete }: Props) {
  const [view, setView] = useState<View>("home");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4 py-6">
      <Brand />
      {view === "home"   && <HomeView   onPortal={() => setView("portal")} onGuest={() => setView("guest")} />}
      {view === "guest"  && <GuestView  onBack={() => setView("home")} onComplete={onComplete} />}
      {view === "portal" && <PortalView onBack={() => setView("home")} onComplete={onComplete} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  HOME view — three elements only                                           */
/* ══════════════════════════════════════════════════════════════════════════ */

function HomeView({
  onPortal,
  onGuest,
}: {
  onPortal: () => void;
  onGuest: () => void;
}) {
  return (
    <Card>
      {/* Primary CTA → guest / trial sign-up */}
      <button
        onClick={onGuest}
        className="w-full py-3.5 rounded-3xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] active:brightness-90 mb-3"
        style={{ background: "linear-gradient(to right, #046A38 50%, #DA291C 50%)" }}
        data-testid="button-cta"
      >
        5 Day Free Trial &bull; No Card Needed
      </button>

      {/* Secondary tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onPortal}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-3.5 rounded-2xl transition-all active:scale-[0.97] active:brightness-90"
          style={{ backgroundColor: PT.green }}
          data-testid="button-portal"
        >
          <span className="text-sm font-bold text-white">Portal</span>
          <span className="text-xs text-white opacity-80">Learning in Progress</span>
        </button>

        <button
          onClick={onGuest}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-3.5 rounded-2xl transition-all active:scale-[0.97] active:brightness-90"
          style={{ backgroundColor: "#F2C94C" }}
          data-testid="button-guest"
        >
          <span className="text-sm font-bold" style={{ color: "#1a1200" }}>Guest</span>
          <span className="text-xs" style={{ color: "#3d2e00" }}>Try free trial</span>
        </button>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  GUEST view — sign-up form → creates account + starts trial               */
/* ══════════════════════════════════════════════════════════════════════════ */

function GuestView({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const init = loadCreds();
  const [name, setName] = useState(init.name ?? "");
  const [preferredName, setPreferredName] = useState(init.preferredName ?? "");
  const [email, setEmail] = useState(init.email ?? "");
  const [password, setPassword] = useState(init.password ?? "");
  const [phone, setPhone] = useState(init.phone ?? "");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [hasSaved, setHasSaved] = useState(() => !!loadCreds().email);

  const fillSaved = () => {
    const s = loadCreds();
    setName(s.name ?? ""); setPreferredName(s.preferredName ?? "");
    setEmail(s.email ?? ""); setPassword(s.password ?? ""); setPhone(s.phone ?? "");
  };
  const clearSaved = () => {
    wipeCreds(); setName(""); setPreferredName(""); setEmail(""); setPassword(""); setPhone(""); setHasSaved(false);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    setLoadingLabel("Creating your account…");
    saveCreds({ name, preferredName: preferredName || undefined, email, password, phone: phone || undefined });
    setHasSaved(true);
    await delay(480);

    const result = createAccount({ name, preferredName: preferredName || undefined, email, password, phone: phone || undefined });

    if (!result.success) {
      setLoading(false);
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess("Account created! Starting your free trial…");
    await delay(1100);
    setLoading(false);
    onComplete();
  };

  return (
    <Card>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors mb-4 -ml-1"
        data-testid="button-back-guest"
      >
        <ArrowLeft size={16} />
        <span className="text-xs font-semibold">Back</span>
      </button>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
        {/* Full name */}
        <div>
          <FieldLabel>Full name</FieldLabel>
          <InputWrap>
            <FieldIcon><User size={15} /></FieldIcon>
            <input
              type="text" placeholder="Maria Silva" value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls} autoComplete="name" data-testid="input-name"
            />
          </InputWrap>
        </div>

        {/* Preferred name */}
        <div>
          <FieldLabel>
            What would you like to be called?{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </FieldLabel>
          <InputWrap>
            <FieldIcon><Smile size={15} /></FieldIcon>
            <input
              type="text" placeholder="e.g. Akilla" value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              className={inputCls} autoComplete="nickname" data-testid="input-preferred-name"
            />
          </InputWrap>
        </div>

        {/* Email */}
        <div>
          <FieldLabel>Email address</FieldLabel>
          <InputWrap>
            <FieldIcon><Mail size={15} /></FieldIcon>
            <input
              type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls} autoComplete="email" data-testid="input-email"
            />
          </InputWrap>
        </div>

        {/* Password */}
        <div>
          <FieldLabel>Password</FieldLabel>
          <InputWrap>
            <FieldIcon><Lock size={15} /></FieldIcon>
            <input
              type={showPw ? "text" : "password"} placeholder="Min. 8 characters" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-10`} autoComplete="new-password" data-testid="input-password"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </InputWrap>
        </div>

        {/* Phone (optional) */}
        <div>
          <FieldLabel>
            Phone number <span className="text-slate-400 font-normal">(optional)</span>
          </FieldLabel>
          <InputWrap>
            <FieldIcon><Phone size={15} /></FieldIcon>
            <input
              type="tel" placeholder="+44 7700 900000" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls} autoComplete="tel" data-testid="input-phone"
            />
          </InputWrap>
        </div>

        {error && <ErrorBox message={error} />}
        {success && <SuccessBox message={success} />}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-3xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] active:brightness-90 disabled:opacity-80 mt-1"
          style={{ background: "linear-gradient(to right, #046A38 50%, #DA291C 50%)" }}
          data-testid="button-signup"
        >
          {loading
            ? <><Spinner />{loadingLabel}</>
            : <>5 Day Free Trial &bull; No Card Needed</>}
        </button>

        {/* Test convenience */}
        {hasSaved && (
          <div className="flex items-center justify-center gap-4 pt-1">
            <button type="button" onClick={fillSaved}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
              Use saved details
            </button>
            <span className="text-slate-200 select-none">|</span>
            <button type="button" onClick={clearSaved}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
              Clear details
            </button>
          </div>
        )}
      </form>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  PORTAL view — sign-in form                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

function PortalView({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const init = loadCreds();
  const [email, setEmail] = useState(init.email ?? "");
  const [password, setPassword] = useState(init.password ?? "");
  const [showPw, setShowPw] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [hasSaved, setHasSaved] = useState(() => !!loadCreds().email);

  const fillSaved = () => {
    const s = loadCreds();
    setEmail(s.email ?? ""); setPassword(s.password ?? "");
  };
  const clearSaved = () => {
    wipeCreds(); setEmail(""); setPassword(""); setHasSaved(false);
  };

  /* Forgot password */
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const openReset = () => { setResetEmail(email); setResetSent(false); setShowReset(true); };
  const closeReset = () => { setShowReset(false); setResetSent(false); setResetEmail(""); };
  const handleReset = () => {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setTimeout(() => { setResetLoading(false); setResetSent(true); }, 900);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    setLoadingLabel("Signing you in…");
    saveCreds({ email, password });
    setHasSaved(true);
    await delay(480);

    const result = loginUser(email, password, keepSignedIn);

    if (!result.success) {
      setLoading(false);
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess("Welcome back!");
    await delay(700);
    setLoading(false);
    onComplete();
  };

  return (
    <>
      <Card>
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors mb-4 -ml-1"
          data-testid="button-back-portal"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-semibold">Back</span>
        </button>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
          {/* Email */}
          <div>
            <FieldLabel>Email address</FieldLabel>
            <InputWrap>
              <FieldIcon><Mail size={15} /></FieldIcon>
              <input
                type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls} autoComplete="email" data-testid="input-login-email"
              />
            </InputWrap>
          </div>

          {/* Password */}
          <div>
            <FieldLabel>Password</FieldLabel>
            <InputWrap>
              <FieldIcon><Lock size={15} /></FieldIcon>
              <input
                type={showPw ? "text" : "password"} placeholder="Your password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-10`} autoComplete="current-password" data-testid="input-login-password"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </InputWrap>
            <div className="flex justify-end mt-2">
              <button
                type="button" onClick={openReset}
                className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
                data-testid="button-forgot-password"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Keep me signed in */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              data-testid="checkbox-keep-signed-in"
            />
            <span className="text-xs text-slate-500">Keep me signed in</span>
          </label>

          {error && <ErrorBox message={error} />}
          {success && <SuccessBox message={success} />}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-3xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-80"
            style={{ backgroundColor: PT.green, boxShadow: "0 4px 18px rgba(4,106,56,0.30)" }}
            data-testid="button-login"
          >
            {loading
              ? <><Spinner />{loadingLabel}</>
              : <>Enter Portal <ArrowRight size={16} /></>}
          </button>

          <p className="text-center text-xs text-slate-400 mt-1">
            Use the email and password you created at sign-up.
          </p>

          {/* Test convenience */}
          {hasSaved && (
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={fillSaved}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
                Use saved details
              </button>
              <span className="text-slate-200 select-none">|</span>
              <button type="button" onClick={clearSaved}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
                Clear details
              </button>
            </div>
          )}
        </form>
      </Card>

      {/* ── Forgot Password Modal ── */}
      {showReset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeReset(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-7 w-full max-w-sm feedback-reveal">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Reset your password</h2>
                {!resetSent && <p className="text-xs text-slate-400 mt-0.5">We'll send a link to your inbox</p>}
              </div>
              <button onClick={closeReset}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {resetSent ? (
              <div className="flex flex-col items-center text-center py-4 gap-3 feedback-reveal">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: PT.greenBg }}>
                  <CheckCircle size={24} style={{ color: PT.green }} />
                </div>
                <p className="text-sm font-semibold text-slate-700 leading-snug">
                  If this email exists, a reset link has been sent.
                </p>
                <p className="text-xs text-slate-400">Check your inbox and spam folder.</p>
                <button onClick={closeReset}
                  className="mt-2 w-full py-3.5 rounded-3xl text-white font-bold text-sm transition-all active:scale-[0.98]"
                  style={{ backgroundColor: PT.green }}>
                  Back to Portal
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleReset(); }}>
                <div>
                  <FieldLabel>Email address</FieldLabel>
                  <InputWrap>
                    <FieldIcon><Mail size={15} /></FieldIcon>
                    <input type="email" placeholder="you@example.com" value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className={inputCls} autoComplete="email" autoFocus
                      data-testid="input-reset-email" />
                  </InputWrap>
                </div>
                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail.trim()}
                  className="w-full py-4 rounded-3xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ backgroundColor: PT.green }}
                  data-testid="button-send-reset">
                  {resetLoading ? <Spinner /> : <>Send reset link <ArrowRight size={16} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
