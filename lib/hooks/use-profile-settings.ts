"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { PROFILE_BY_NICKNAME } from "@/lib/graphql";
import type { CreatorProfileSettings } from "@/lib/types";

const defaults: CreatorProfileSettings = {
  displayName: "",
  bio: "",
  avatarUrl: "",
  profileStatus: "Verified creator"
};

function storageKey(nickname: string) {
  return `flick.profile.${nickname.toLowerCase()}`;
}

function isSafeAvatarUrl(value: string) {
  if (!value) return true;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function useProfileSettings(nickname?: string) {
  const key = useMemo(() => (nickname ? storageKey(nickname) : null), [nickname]);
  const [settings, setSettings] = useState<CreatorProfileSettings>(defaults);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profileQuery = useQuery<{
    profileUpdateds: Array<CreatorProfileSettings & { id: string; nickname: string; timestampParam?: string }>;
  }>(PROFILE_BY_NICKNAME, {
    variables: { nickname: nickname?.toLowerCase() },
    skip: !nickname,
    fetchPolicy: "cache-and-network",
    pollInterval: 12_000
  });

  useEffect(() => {
    setDirty(false);
    if (!key) {
      setSettings(defaults);
      return;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      setSettings(defaults);
      return;
    }

    try {
      setSettings({ ...defaults, ...JSON.parse(raw) });
    } catch {
      setSettings(defaults);
    }
  }, [key]);

  useEffect(() => {
    const indexed = profileQuery.data?.profileUpdateds?.[0];
    if (!key || !indexed || dirty || indexed.nickname.toLowerCase() !== nickname?.toLowerCase()) return;

    const next = {
      displayName: indexed.displayName || "",
      bio: indexed.bio || "",
      avatarUrl: indexed.avatarUrl || "",
      profileStatus: indexed.profileStatus || "Verified creator"
    };
    setSettings(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  }, [dirty, key, nickname, profileQuery.data]);

  function updateSettings(next: CreatorProfileSettings) {
    setDirty(true);
    setSettings(next);
  }

  function save(next: CreatorProfileSettings) {
    if (!key) return false;
    const avatarUrl = next.avatarUrl.trim().slice(0, 512);
    if (!isSafeAvatarUrl(avatarUrl)) {
      setError("Upload a valid image file.");
      return false;
    }
    const cleaned = {
      displayName: next.displayName.trim().slice(0, 48),
      bio: next.bio.trim().slice(0, 160),
      avatarUrl,
      profileStatus: next.profileStatus.trim().slice(0, 48)
    };
    window.localStorage.setItem(key, JSON.stringify(cleaned));
    setSettings(cleaned);
    setDirty(false);
    setError(null);
    setSavedAt(Date.now());
    return true;
  }

  return {
    settings,
    setSettings: updateSettings,
    save,
    savedAt,
    error,
    loading: profileQuery.loading,
    refetch: profileQuery.refetch
  };
}
