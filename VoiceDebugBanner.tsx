import { useState, useEffect } from "react";
import { getVoiceInfo, subscribeVoiceInfo } from "@/hooks/useSpeech";

/**
 * Temporary on-screen debug strip shown below the header.
 * Remove this component (and its import in AppHeader) when testing is done.
 */
export default function VoiceDebugBanner() {
  const [info, setInfo] = useState(getVoiceInfo);

  useEffect(() => {
    const unsub = subscribeVoiceInfo(() => setInfo(getVoiceInfo()));

    if (!("speechSynthesis" in window)) return unsub;

    function detect() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const FEMALE_PT = ["joana","hortencia","hortência","fernanda","luciana","ines","inês","catarina","ana","maria","lucia","lúcia","beatriz"];
      const FEMALE_EN = ["female","hazel","sonia","kate","zira","samantha","victoria","karen","ava","allison","google uk english female","amy","joanna","emma","microsoft aria","microsoft jenny","microsoft libby","microsoft natasha"];
      const isF = (v: SpeechSynthesisVoice, list: string[]) => list.some((f) => v.name.toLowerCase().includes(f));

      const ptPTF = voices.filter((v) => v.lang === "pt-PT" && isF(v, FEMALE_PT));
      if (ptPTF.length) { setInfo({ label: `${ptPTF[0].name} (${ptPTF[0].lang})`, isFemaleVoice: true, isPtVoice: true, isGoogleTTS: false, tier: "pt-PT female", noVoicesAtAll: false }); return; }

      const ptPTA = voices.filter((v) => v.lang === "pt-PT");
      if (ptPTA.length) { setInfo({ label: `${ptPTA[0].name} (${ptPTA[0].lang})`, isFemaleVoice: isF(ptPTA[0], FEMALE_PT), isPtVoice: true, isGoogleTTS: false, tier: "pt-PT (any)", noVoicesAtAll: false }); return; }

      const ptBRF = voices.filter((v) => v.lang.startsWith("pt") && isF(v, FEMALE_PT));
      if (ptBRF.length) { setInfo({ label: `${ptBRF[0].name} (${ptBRF[0].lang})`, isFemaleVoice: true, isPtVoice: true, isGoogleTTS: false, tier: "pt-BR female", noVoicesAtAll: false }); return; }

      const ptA = voices.filter((v) => v.lang.startsWith("pt"));
      if (ptA.length) { setInfo({ label: `${ptA[0].name} (${ptA[0].lang})`, isFemaleVoice: isF(ptA[0], FEMALE_PT), isPtVoice: true, isGoogleTTS: false, tier: "pt (any)", noVoicesAtAll: false }); return; }

      const enF = voices.find((v) => v.lang.startsWith("en") && isF(v, FEMALE_EN));
      if (enF) {
        // No pt browser voice — Google TTS will be used as fallback
        setInfo({ label: "Google TTS (pt-PT female)", isFemaleVoice: true, isPtVoice: true, isGoogleTTS: true, tier: "Google TTS · online service", noVoicesAtAll: false });
        return;
      }

      setInfo({ label: voices[0].name, isFemaleVoice: false, isPtVoice: false, isGoogleTTS: false, tier: "last resort", noVoicesAtAll: false });
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      detect();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", detect, { once: true } as EventListenerOptions);
    }

    return () => { unsub(); window.speechSynthesis.removeEventListener("voiceschanged", detect); };
  }, []);

  const { label, isPtVoice, isGoogleTTS, tier, noVoicesAtAll } = info;
  const detecting = label === "Detecting…";

  if (detecting) {
    return (
      <div className="w-full px-4 py-1 text-center text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
        🔊 Detecting voice…
      </div>
    );
  }

  if (noVoicesAtAll) {
    return (
      <div className="w-full px-4 py-1.5 text-center text-xs font-medium bg-red-50 text-red-600 border-b border-red-100">
        ⚠ No TTS voices found — speech unavailable in this browser.
      </div>
    );
  }

  if (isGoogleTTS) {
    return (
      <div className="w-full px-4 py-1 text-center text-xs font-medium bg-blue-50 text-blue-700 border-b border-blue-100">
        🔊 Voice: <strong>Português (pt-PT female)</strong> &nbsp;·&nbsp;
        <span className="opacity-75">Google TTS online · no pt-PT voice installed on this device</span>
      </div>
    );
  }

  if (!isPtVoice) {
    return (
      <div className="w-full px-4 py-1.5 text-center text-xs font-medium bg-amber-50 text-amber-700 border-b border-amber-100">
        ⚠ Your device does not support European Portuguese voice yet. &nbsp;·&nbsp;
        <span className="opacity-75">Using: {label}</span>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-1 text-center text-xs font-medium bg-emerald-50 text-emerald-700 border-b border-emerald-100">
      🔊 Voice: <strong>{label}</strong> &nbsp;·&nbsp;
      <span className="opacity-75">{tier}</span>
    </div>
  );
}
