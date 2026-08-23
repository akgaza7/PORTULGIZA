"use client";

import { portugueseAudioManifest } from "@/lib/portuguese-audio-manifest";

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
let normalizedAudioManifest: Map<string, (typeof portugueseAudioManifest)[string]> | null = null;

function normalizePortugueseText(text: string) {
  return text
    .trim()
    .toLocaleLowerCase("pt-PT")
    .replace(/[.!?…]+$/u, "")
    .replace(/\s+/g, " ");
}

export function resolvePortugueseVoiceGender(text: string, voiceGender?: PortugueseVoiceGender) {
  // Inês is the agreed speaker for this greeting. This affects only the
  // character voice; the lesson still correctly teaches dia as masculine.
  if (/\bbom dia\b/u.test(normalizePortugueseText(text))) return "feminine";

  return voiceGender ?? "feminine";
}

function findRecordedAudio(text: string, gender: PortugueseVoiceGender) {
  normalizedAudioManifest ??= new Map(
    Object.entries(portugueseAudioManifest).map(([recordedText, sources]) => [
      normalizePortugueseText(recordedText),
      sources
    ])
  );

  return normalizedAudioManifest.get(normalizePortugueseText(text))?.[gender];
}

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

  const gender = resolvePortugueseVoiceGender(text, handlers.voiceGender);
  const recordedAudio = portugueseAudioManifest[text]?.[gender] ?? findRecordedAudio(text, gender);

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
    const portugalVoice = findEuropeanPortugueseVoice(window.speechSynthesis.getVoices(), gender);
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
