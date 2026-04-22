"use client";

import { useSyncExternalStore } from "react";
import type { MusicPrefs } from "./types";

const MUSIC_KEY = "news-app.music-prefs.v1";

const DEFAULT_MUSIC: MusicPrefs = {
  likedArtists: [],
  dislikedArtists: [],
  genres: [],
  lastSession: { updatedAt: new Date(0).toISOString() },
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type Listener = () => void;
const musicListeners = new Set<Listener>();
let musicCache: MusicPrefs | null = null;

function readMusic(): MusicPrefs {
  if (typeof window === "undefined") return DEFAULT_MUSIC;
  if (musicCache) return musicCache;
  const stored = safeParse<MusicPrefs>(
    localStorage.getItem(MUSIC_KEY),
    DEFAULT_MUSIC,
  );
  musicCache = {
    ...DEFAULT_MUSIC,
    ...stored,
    lastSession: { ...DEFAULT_MUSIC.lastSession, ...stored.lastSession },
  };
  return musicCache;
}

export function getMusicPrefs(): MusicPrefs {
  return readMusic();
}

export function setMusicPrefs(next: MusicPrefs): MusicPrefs {
  const merged: MusicPrefs = {
    ...next,
    lastSession: {
      ...next.lastSession,
      updatedAt: new Date().toISOString(),
    },
  };
  musicCache = merged;
  if (typeof window !== "undefined") {
    localStorage.setItem(MUSIC_KEY, JSON.stringify(merged));
  }
  musicListeners.forEach((l) => l());
  return merged;
}

function subscribeMusic(listener: Listener): () => void {
  musicListeners.add(listener);
  return () => musicListeners.delete(listener);
}

export function useMusicPrefs(): MusicPrefs {
  return useSyncExternalStore(subscribeMusic, readMusic, () => DEFAULT_MUSIC);
}
