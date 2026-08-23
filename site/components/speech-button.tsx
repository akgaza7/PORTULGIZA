"use client";

import { useState } from "react";
import { portugueseAudioManifest } from "@/lib/portuguese-audio-manifest";

type SpeechButtonProps = {
  text: string;
  onListen?: () => void;
  label?: string;
  voiceGender?: PortugueseVoiceGender;
};

export type PortugueseVoiceGender = "masculine" | "feminine";

type SpeechHandlers = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  voiceGender?: PortugueseVoiceGender;
  rate?: number;
};

const feminineVoiceNames = ["helia", "joana", "raquel", "fernanda", "ines", "inês", "maria", "catarina", "luciana", "francisca", "female", "mulher"];
const masculineVoiceNames = ["duarte", "joaquim", "jorge", "joao", "joão", "tiago", "antonio", "antónio", "ricardo", "cristiano", "male", "homem"];
let activeAudio: HTMLAudioElement | null = null;

function findEuropeanPortugueseVoice(voices: SpeechSynthesisVoice[], voiceGender?: PortugueseVoiceGender) {
  const portugalVoices = voices.filter((voice) => {
    const language = voice.lang.replace("_", "-").toLocaleLowerCase();
    const identity = `${voice.name} ${voice.voiceURI}`.toLocaleLowerCase();
    return language === "pt-pt" || (language.startsWith("pt-") && identity.includes("portugal"));
  });
  const genderNames = voiceGender === "feminine"
    ? feminineVoiceNames
    : voiceGender === "masculine"
      ? masculineVoiceNames
      : [];
  const matchedGenderVoice = portugalVoices.find((voice) => {
    const identity = `${voice.name} ${voice.voiceURI}`.toLocaleLowerCase();
    return genderNames.some((name) => identity.includes(name));
  });

  return matchedGenderVoice ?? portugalVoices.find((voice) => voice.localService) ?? portugalVoices[0];
}

export function speakEuropeanPortuguese(text: string, handlers: SpeechHandlers = {}) {
  if (typeof window === "undefined") {
    return false;
  }

  activeAudio?.pause();
  activeAudio = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();

  const gender = handlers.voiceGender ?? "feminine";
  const recordedAudio = portugueseAudioManifest[text]?.[gender];

  if (recordedAudio) {
    const audio = new Audio(recordedAudio);
    activeAudio = audio;
    audio.preload = "auto";
    audio.onplay = () => handlers.onStart?.();
    audio.onended = () => {
      if (activeAudio === audio) activeAudio = null;
      handlers.onEnd?.();
    };
    audio.onerror = () => {
      if (activeAudio === audio) activeAudio = null;
      handlers.onError?.();
    };
    void audio.play().catch(() => {
      if (activeAudio === audio) activeAudio = null;
      handlers.onError?.();
    });
    return true;
  }

  if (!("speechSynthesis" in window)) {
    handlers.onError?.();
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-PT";
  utterance.rate = handlers.rate ?? 0.9;
  utterance.onstart = () => handlers.onStart?.();
  utterance.onend = () => handlers.onEnd?.();
  utterance.onerror = () => handlers.onError?.();

  const play = (reportFailure = true) => {
    const portugalVoice = findEuropeanPortugueseVoice(window.speechSynthesis.getVoices(), handlers.voiceGender);
    if (!portugalVoice) {
      if (reportFailure) handlers.onError?.();
      return false;
    }

    utterance.voice = portugalVoice;
    window.speechSynthesis.speak(utterance);
    return true;
  };

  if (!play(false)) {
    let settled = false;
    const retry = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.speechSynthesis.removeEventListener("voiceschanged", retry);
      play();
    };
    const timeout = window.setTimeout(retry, 1200);
    window.speechSynthesis.addEventListener("voiceschanged", retry, { once: true });
  }
  return true;
}

export function SpeechButton({ text, onListen, label = "Listen", voiceGender }: SpeechButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    speakEuropeanPortuguese(text, {
      onStart: () => {
        setSpeaking(true);
        onListen?.();
      },
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
      voiceGender
    });
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      aria-label={`${label}${voiceGender ? ` with a ${voiceGender} European Portuguese voice` : ""}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
        speaking
          ? "border-clay bg-clay text-white"
          : "border-clay/20 bg-clay/10 text-clay hover:bg-clay hover:text-white"
      }`}
    >
      <span>{speaking ? "Playing..." : label}</span>
      <span aria-hidden="true">▸</span>
    </button>
  );
}
