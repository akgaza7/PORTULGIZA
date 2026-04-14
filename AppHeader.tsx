import { PT } from "@/lib/colors";
import { loadOnboarding } from "@/store/onboarding";

interface AppHeaderProps {
  onBack?: () => void;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  sticky?: boolean;
  shrink?: boolean;
}

function LevelStrip({ level }: { level: "beginner" | "intermediate" }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 border-b border-slate-100">
      <span
        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
        style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
      >
        ● L1 Principiante
      </span>
      <span className="text-slate-300 text-xs font-bold">›</span>
      <span
        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
        style={
          level === "intermediate"
            ? { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
            : { backgroundColor: "#F1F5F9", color: "#94A3B8" }
        }
      >
        {level === "intermediate" ? "● L2 Intermédio" : "🔒 L2 Intermédio"}
      </span>
    </div>
  );
}

export default function AppHeader({
  onBack,
  right,
  bottom,
  sticky = true,
  shrink = false,
}: AppHeaderProps) {
  const { level } = loadOnboarding();

  return (
    <header
      className={`bg-white ${sticky ? "sticky top-0 z-10" : ""} ${shrink ? "shrink-0" : ""}`}
    >
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        {/* Voltar back button — green pill */}
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="shrink-0 px-3.5 py-1.5 rounded-full font-bold text-xs text-white active:opacity-70 transition-opacity"
            style={{ backgroundColor: PT.green }}
          >
            Voltar
          </button>
        )}

        {/* Brand — logo + wordmark, clickable to go home when onBack provided */}
        <div className="flex items-center gap-3 shrink-0">
          {onBack ? (
            <button onClick={onBack} className="flex items-center gap-3 active:opacity-70 transition-opacity">
              <div className="w-[56px] h-[56px] rounded-xl overflow-hidden shadow-md">
                <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-base font-black tracking-tight text-slate-900 leading-tight">PORTULGIZA</p>
                <p className="text-xs font-bold text-slate-500 leading-tight mt-0.5">Language Learning</p>
              </div>
            </button>
          ) : (
            <>
              <div className="w-[56px] h-[56px] rounded-xl overflow-hidden shadow-md">
                <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-base font-black tracking-tight text-slate-900 leading-tight">PORTULGIZA</p>
                <p className="text-xs font-bold text-slate-500 leading-tight mt-0.5">Language Learning</p>
              </div>
            </>
          )}
        </div>

        {/* Right slot */}
        {right && (
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            {right}
          </div>
        )}
      </div>

      {/* Bottom slot */}
      {bottom}

      {/* Portuguese flag tricolor accent strip */}
      <div className="flex">
        <div className="flex-1 h-[4px]" style={{ backgroundColor: "#046A38" }} />
        <div className="flex-1 h-[4px]" style={{ backgroundColor: "#FFD700" }} />
        <div className="flex-1 h-[4px]" style={{ backgroundColor: "#DA291C" }} />
      </div>

      {/* Level progress strip */}
      <LevelStrip level={level} />
    </header>
  );
}
