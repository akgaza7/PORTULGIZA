import { useState } from "react";
import { CheckCircle, X, Zap, BookOpen, Flame, Volume2, CreditCard, Loader2 } from "lucide-react";
import { loadUser } from "@/store/auth";
import { PT } from "@/lib/colors";

interface Props {
  onSubscribed: () => void;
  onDismiss?: () => void;
  isExpired?: boolean;
}

const FEATURES = [
  { icon: <BookOpen size={16} />, text: "All 4 lesson categories, fully unlocked" },
  { icon: <Zap size={16} />, text: "Unlimited quizzes — Single, Timed & Two Player" },
  { icon: <Flame size={16} />, text: "Daily Challenge & streak tracking" },
  { icon: <Volume2 size={16} />, text: "Native European Portuguese audio" },
];

const PAYMENT_ICONS = [
  { label: "Visa" },
  { label: "Mastercard" },
  { label: "Apple Pay" },
  { label: "Google Pay" },
];

export default function UpgradeScreen({ onSubscribed, onDismiss, isExpired = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = loadUser();
      const baseUrl = window.location.origin + window.location.pathname;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.email ?? "anonymous",
          email: user?.email,
          baseUrl,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? "Failed to start checkout");
      }

      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg, #e8f5ee 0%, #fff8e1 50%, #fdecea 100%)" }}>
      {onDismiss && !isExpired && (
        <button
          onClick={onDismiss}
          className="absolute top-5 right-5 p-2 rounded-2xl hover:bg-slate-100 transition-colors text-slate-400"
        >
          <X size={20} />
        </button>
      )}

      <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>

        {/* Portuguese flag tricolor header bar */}
        <div className="flex h-2">
          <div className="flex-1" style={{ backgroundColor: "#046A38" }} />
          <div className="flex-1" style={{ backgroundColor: "#FFD700" }} />
          <div className="flex-1" style={{ backgroundColor: "#DA291C" }} />
        </div>

        <div className="p-7">
          <div className="text-center mb-6">
            {/* Real logo */}
            <div className="mx-auto mb-4 w-20 h-20 rounded-2xl overflow-hidden shadow-md"
              style={{ border: "2px solid #e2e8f0" }}>
              <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-full h-full object-cover" />
            </div>
            {isExpired ? (
              <>
                <h2 className="text-xl font-extrabold text-slate-800 mb-2">Your free trial has ended</h2>
                <p className="text-sm text-slate-500">
                  Unlock full access to continue learning European Portuguese.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-slate-800 mb-2">Unlock full access</h2>
                <p className="text-sm text-slate-500">
                  Get everything PORTULGIZA has to offer.
                </p>
              </>
            )}
          </div>

          <div
            className="rounded-2xl p-5 text-center mb-6"
            style={{ background: "linear-gradient(135deg, #e8f5ee, #f0fdf4)", border: `2px solid ${PT.green}` }}
          >
            <p className="text-4xl font-extrabold" style={{ color: PT.green }}>£4.99</p>
            <p className="text-sm text-slate-500 mt-1">per month · cancel anytime</p>
          </div>

        <ul className="space-y-3 mb-6">
          {FEATURES.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
              <span style={{ color: PT.green }}>{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>

        {error && (
          <div className="mb-4 rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 rounded-3xl text-white font-bold text-sm transition-all active:scale-[0.98] mb-3 flex items-center justify-center gap-2"
          style={{ backgroundColor: loading ? "#93c5fd" : "#2563eb" }}
          data-testid="button-subscribe"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Opening secure payment page…
            </>
          ) : (
            <>
              <CreditCard size={16} />
              Add payment details — £4.99/mo
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mb-3">
          You'll be taken to our secure payment page to enter your card or bank details.
        </p>

        {onDismiss && !isExpired && (
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-3xl border-2 border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors"
            data-testid="button-maybe-later"
          >
            I am not Ready to learn
          </button>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400 mb-3">Accepted payment methods</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {PAYMENT_ICONS.map((p) => (
              <span
                key={p.label}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500"
              >
                {p.label}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            🔒 Secure payment via Stripe · No hidden fees
          </p>
        </div>
        </div>{/* end p-7 */}
      </div>{/* end card */}
    </div>
  );
}
