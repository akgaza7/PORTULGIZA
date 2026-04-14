import { useState, useCallback, useRef, useEffect } from "react";

// ─── Voice selection ──────────────────────────────────────────────────────────
// Original logic: prefer exact pt-PT match, then any pt voice.
// No female-name filtering — that was accidentally excluding valid voices.

function getBestPortugueseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const ptPT = voices.find((v) => v.lang === "pt-PT");
  if (ptPT) return ptPT;
  const ptAny = voices.find((v) => v.lang.startsWith("pt"));
  if (ptAny) return ptAny;
  return null;
}

// ─── VoiceInfo (kept for VoiceDebugBanner) ────────────────────────────────────

export interface VoiceInfo {
  label: string;
  isFemaleVoice: boolean;
  isPtVoice: boolean;
  isGoogleTTS: boolean;
  tier: string;
  noVoicesAtAll: boolean;
}

let _currentInfo: VoiceInfo = {
  label: "Detecting…",
  isFemaleVoice: false,
  isPtVoice: false,
  isGoogleTTS: false,
  tier: "",
  noVoicesAtAll: false,
};
const _listeners = new Set<() => void>();

function broadcastVoiceInfo(info: VoiceInfo) {
  _currentInfo = info;
  _listeners.forEach((fn) => fn());
}

export function getVoiceInfo(): VoiceInfo { return _currentInfo; }
export function subscribeVoiceInfo(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ─── Mobile unlock ─────────────────────────────────────────────────────────────

let primed = false;
function primeSpeechSynthesis() {
  if (primed || !("speechSynthesis" in window)) return;
  primed = true;
  const u = new SpeechSynthesisUtterance("");
  u.volume = 0;
  u.lang = "pt-PT";
  window.speechSynthesis.speak(u);
  window.speechSynthesis.cancel();
}

// ─── Chrome resume-loop workaround ────────────────────────────────────────────

let resumeTimer: ReturnType<typeof setInterval> | null = null;
function startResumeLoop() {
  stopResumeLoop();
  resumeTimer = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    } else {
      stopResumeLoop();
    }
  }, 10_000);
}
function stopResumeLoop() {
  if (resumeTimer !== null) { clearInterval(resumeTimer); resumeTimer = null; }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const SPEAK_DELAY_MS = 300;

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onVoicesReady() {
      const voices = window.speechSynthesis.getVoices();
      const voice = getBestPortugueseVoice(voices);
      const info: VoiceInfo = voice
        ? {
            label: `${voice.name} (${voice.lang})`,
            isFemaleVoice: false,
            isPtVoice: true,
            isGoogleTTS: false,
            tier: voice.lang === "pt-PT" ? "pt-PT" : "pt (any)",
            noVoicesAtAll: false,
          }
        : {
            label: voices.length === 0 ? "No voices available" : `${voices[0].name} (${voices[0].lang})`,
            isFemaleVoice: false,
            isPtVoice: false,
            isGoogleTTS: false,
            tier: voices.length === 0 ? "none" : "last resort",
            noVoicesAtAll: voices.length === 0,
          };

      console.log("[useSpeech] Voices loaded:", voices.length);
      console.log("[useSpeech] Selected voice:", voice ? `${voice.name} (${voice.lang})` : "none");
      broadcastVoiceInfo(info);
      setVoicesLoaded(true);
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      onVoicesReady();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesReady, {
        once: true,
      } as EventListenerOptions);
    }
    return () => window.speechSynthesis.removeEventListener("voiceschanged", onVoicesReady);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();
      setSpeaking(false);
      if (delayRef.current !== null) { clearTimeout(delayRef.current); delayRef.current = null; }

      delayRef.current = setTimeout(() => {
        delayRef.current = null;
        primeSpeechSynthesis();

        const voices = window.speechSynthesis.getVoices();
        const voice = getBestPortugueseVoice(voices);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-PT";
        if (voice) utterance.voice = voice;

        // Original voice settings from the first build
        utterance.rate   = 0.85;
        utterance.pitch  = 1.0;
        utterance.volume = 1.0;

        console.log(`[useSpeech] Speaking "${text.slice(0, 40)}" | voice: "${voice?.name ?? "default"}" | rate: 0.85 | pitch: 1.0`);

        utterance.onstart = () => { setSpeaking(true);  startResumeLoop(); };
        utterance.onend   = () => { setSpeaking(false); stopResumeLoop();  };
        utterance.onerror = () => { setSpeaking(false); stopResumeLoop();  };

        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      }, SPEAK_DELAY_MS);
    },
    [voicesLoaded],
  );

  const speakSlow = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();
      setSpeaking(false);
      if (delayRef.current !== null) { clearTimeout(delayRef.current); delayRef.current = null; }

      delayRef.current = setTimeout(() => {
        delayRef.current = null;
        primeSpeechSynthesis();

        const voices = window.speechSynthesis.getVoices();
        const voice = getBestPortugueseVoice(voices);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-PT";
        if (voice) utterance.voice = voice;

        utterance.rate   = 0.6;
        utterance.pitch  = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => { setSpeaking(true);  startResumeLoop(); };
        utterance.onend   = () => { setSpeaking(false); stopResumeLoop();  };
        utterance.onerror = () => { setSpeaking(false); stopResumeLoop();  };

        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      }, SPEAK_DELAY_MS);
    },
    [voicesLoaded],
  );

  const stop = useCallback(() => {
    if (delayRef.current !== null) { clearTimeout(delayRef.current); delayRef.current = null; }
    window.speechSynthesis.cancel();
    setSpeaking(false);
    stopResumeLoop();
  }, []);

  return { speak, speakSlow, stop, speaking };
}
