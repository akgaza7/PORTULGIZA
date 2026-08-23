"use client";

import { useEffect } from "react";
import { speakEuropeanPortuguese } from "@/components/speech-button";
import { useAvatarPreference } from "@/lib/avatar-preference";

const selector = '[lang="pt-PT"]';

function enhancePortugueseText(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    if (element.closest('[data-portuguese-voice-managed="true"]')) return;

    element.dataset.portugueseVoice = "true";
    element.title ||= "Click to hear this in European Portuguese";
    if (!element.closest("button, a, input, select, textarea")) {
      element.tabIndex = 0;
      element.setAttribute("role", "button");
    }
  });
}

export function PortugueseVoiceLayer() {
  const { avatar } = useAvatarPreference();

  useEffect(() => {
    const voiceGender = avatar === "male" ? "masculine" : "feminine";
    const speakFromTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return;
      const element = target.closest<HTMLElement>(selector);
      if (!element || element.closest('[data-portuguese-voice-managed="true"]')) return;

      const text = element.textContent?.trim();
      if (text) speakEuropeanPortuguese(text, { voiceGender });
    };
    const handleClick = (event: MouseEvent) => speakFromTarget(event.target);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.dataset.portugueseVoice !== "true") return;
      event.preventDefault();
      speakFromTarget(target);
    };

    enhancePortugueseText(document);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) enhancePortugueseText(node.matches(selector) ? node.parentNode ?? document : node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [avatar]);

  return null;
}
