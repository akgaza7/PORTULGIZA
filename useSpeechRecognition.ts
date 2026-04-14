import { useState, useRef, useCallback } from "react";

// ─── Text normalisation for comparison ────────────────────────────────────────

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalise(s: string): string {
  return stripDiacritics(s.toLowerCase()).replace(/[^a-z\s]/g, "").trim();
}

/**
 * Checks whether any word in `spoken` fuzzy-matches any word in `target`.
 * Handles plural/singular prefix matches ("nos" ≈ "nós", "ele" ≈ "eles").
 */
export function spokenMatchesTarget(spoken: string, target: string): boolean {
  const sp = normalise(spoken).split(/\s+/);
  const tg = normalise(target).split(/\s+/);
  return tg.every((tw) =>
    sp.some(
      (sw) =>
        sw === tw ||
        sw.startsWith(tw) ||
        tw.startsWith(sw) ||
        (tw.length > 2 && sw.length > 2 && (sw.startsWith(tw.slice(0, -1)) || tw.startsWith(sw.slice(0, -1))))
    )
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

type SRStatus = "idle" | "listening" | "done" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSRClass = (): any =>
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useSpeechRecognition(lang = "pt-PT") {
  const [status, setStatus] = useState<SRStatus>("idle");
  const recognitionRef = useRef<any>(null);
  const supported = !!getSRClass();

  const listen = useCallback(
    (
      onResult: (transcript: string, matches: (target: string) => boolean) => void,
      onError?: () => void
    ) => {
      const SR = getSRClass();
      if (!SR) { onError?.(); return; }

      try { recognitionRef.current?.abort(); } catch { /* ignore */ }

      const rec = new SR();
      recognitionRef.current = rec;
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 5;

      setStatus("listening");

      rec.onresult = (e: any) => {
        const transcripts: string[] = [];
        for (let i = 0; i < e.results[0].length; i++) {
          transcripts.push(e.results[0][i].transcript);
        }
        const full = transcripts.join(" ");
        setStatus("done");
        onResult(full, (target: string) => spokenMatchesTarget(full, target));
      };

      rec.onerror = () => {
        setStatus("error");
        onError?.();
      };

      rec.onend = () => {
        setStatus((prev) => (prev === "listening" ? "idle" : prev));
      };

      rec.start();
    },
    [lang]
  );

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setStatus("idle");
  }, []);

  return { listen, stop, status, supported };
}
