import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, CheckCircle2, RefreshCw, Volume2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type PracticeState = "idle" | "speaking" | "listening" | "correct" | "wrong";

interface WordPracticeButtonProps {
  /** The Portuguese word(s) to practise — will be spoken first, then recognised */
  word: string;
  speak: (text: string) => void;
  /** Compact = small icon-only button, same footprint as Volume2 buttons */
  compact?: boolean;
}

export default function WordPracticeButton({ word, speak, compact = true }: WordPracticeButtonProps) {
  const { listen, supported } = useSpeechRecognition("pt-PT");
  const [state, setState] = useState<PracticeState>("idle");
  const attemptsRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup all timers on unmount
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  };

  const doListen = useCallback(() => {
    setState("listening");
    listen(
      (_transcript, matches) => {
        if (matches(word)) {
          setState("correct");
          attemptsRef.current = 0;
          after(2000, () => setState("idle"));
        } else {
          setState("wrong");
          attemptsRef.current += 1;
          if (attemptsRef.current < 4) {
            // Speak again and re-listen
            after(1000, () => {
              speak(word);
              setState("speaking");
              after(1800, doListen);
            });
          } else {
            // Give up after 3 wrong attempts
            after(1500, () => {
              setState("idle");
              attemptsRef.current = 0;
            });
          }
        }
      },
      () => {
        setState("idle");
        attemptsRef.current = 0;
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, speak, listen]);

  const startPractice = useCallback(() => {
    if (state !== "idle") return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    attemptsRef.current = 0;
    speak(word);
    setState("speaking");
    after(1800, doListen);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, word, speak, doListen]);

  if (!supported) return null;

  // ─── Compact icon button ─────────────────────────────────────────────────────
  if (compact) {
    const cfg = buttonConfig(state);
    return (
      <button
        onClick={startPractice}
        disabled={state !== "idle"}
        title={cfg.title}
        aria-label={cfg.title}
        className={`relative p-2 rounded-2xl border transition-all shrink-0 ${state !== "idle" ? "cursor-not-allowed" : "hover:brightness-95 active:scale-[0.94]"} ${cfg.className}`}
        style={cfg.style}
      >
        {state === "idle"    && <Mic size={15} />}
        {state === "speaking" && <Volume2 size={15} className="animate-pulse" />}
        {state === "listening" && <Mic size={15} className="animate-pulse" />}
        {state === "correct"  && <CheckCircle2 size={15} />}
        {state === "wrong"    && <RefreshCw size={15} />}

        {/* "Speak!" badge floats above when listening */}
        {state === "listening" && (
          <span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap animate-bounce"
            style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
          >
            Speak!
          </span>
        )}
        {state === "correct" && (
          <span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
          >
            ✓ Correct!
          </span>
        )}
        {state === "wrong" && (
          <span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
          >
            Try again…
          </span>
        )}
      </button>
    );
  }

  // ─── Expanded inline version (used in pronoun table) ────────────────────────
  const cfg = buttonConfig(state);
  return (
    <button
      onClick={startPractice}
      disabled={state !== "idle"}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-bold border transition-all ${state !== "idle" ? "cursor-not-allowed" : "hover:brightness-95 active:scale-[0.94]"} ${cfg.className}`}
      style={cfg.style}
      aria-label={cfg.title}
      title={cfg.title}
    >
      {state === "idle"     && <><Mic size={13} /> Repeat</>}
      {state === "speaking" && <><Volume2 size={13} className="animate-pulse" /> Listening…</>}
      {state === "listening" && <><Mic size={13} className="animate-pulse" /> Speak now!</>}
      {state === "correct"  && <><CheckCircle2 size={13} /> Correct!</>}
      {state === "wrong"    && <><RefreshCw size={13} /> Try again…</>}
    </button>
  );
}

// ─── State → visual config ─────────────────────────────────────────────────────

function buttonConfig(state: PracticeState) {
  switch (state) {
    case "idle":
      return {
        title: "Practise speaking — tap to hear, then repeat",
        className: "",
        style: {
          backgroundColor: "#f0fdf4",
          color: "#16a34a",
          borderColor: "#bbf7d0",
        },
      };
    case "speaking":
      return {
        title: "Listen carefully…",
        className: "",
        style: { backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" },
      };
    case "listening":
      return {
        title: "Speak now!",
        className: "",
        style: { backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" },
      };
    case "correct":
      return {
        title: "Well done!",
        className: "",
        style: { backgroundColor: "#dcfce7", color: "#15803d", borderColor: "#86efac" },
      };
    case "wrong":
      return {
        title: "Not quite — trying again…",
        className: "",
        style: { backgroundColor: "#fef3c7", color: "#b45309", borderColor: "#fde68a" },
      };
  }
}
