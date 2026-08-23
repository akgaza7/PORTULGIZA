"use client";

import { useEffect, useState } from "react";

export type AvatarPreference = "female" | "male";

const STORAGE_KEY = "portulgiza-avatar-preference";
const CHANGE_EVENT = "portulgiza-avatar-change";

export const avatarDetails: Record<
  AvatarPreference,
  { label: string; name: string; image: string; imagePosition: string }
> = {
  female: {
    label: "Female avatar",
    name: "Inês",
    image: "/portulgiza-female-avatar.png",
    imagePosition: "object-center"
  },
  male: {
    label: "Male avatar",
    name: "Tiago",
    image: "/portulgiza-male-avatar.webp",
    imagePosition: "object-center"
  }
};

function storedPreference(): AvatarPreference {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "male" ? "male" : "female";
}

export function useAvatarPreference() {
  const [avatar, setAvatarState] = useState<AvatarPreference>("female");

  useEffect(() => {
    setAvatarState(storedPreference());

    const syncPreference = () => setAvatarState(storedPreference());
    window.addEventListener(CHANGE_EVENT, syncPreference);
    window.addEventListener("storage", syncPreference);
    return () => {
      window.removeEventListener(CHANGE_EVENT, syncPreference);
      window.removeEventListener("storage", syncPreference);
    };
  }, []);

  const setAvatar = (nextAvatar: AvatarPreference) => {
    window.localStorage.setItem(STORAGE_KEY, nextAvatar);
    setAvatarState(nextAvatar);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return { avatar, setAvatar, details: avatarDetails[avatar] };
}
