"use client";

import { useState } from "react";

type SpeechButtonProps = {
  text: string;
};

export function SpeechButton({ text }: SpeechButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-PT";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className="inline-flex items-center gap-2 rounded-full border border-pine/15 bg-moss px-3 py-2 text-sm font-medium text-pine transition hover:bg-pine hover:text-white"
    >
      <span>{speaking ? "Playing..." : "Listen"}</span>
      <span aria-hidden="true">▸</span>
    </button>
  );
}
