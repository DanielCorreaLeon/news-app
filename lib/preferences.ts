"use client";

import { useSyncExternalStore } from "react";
import type { AiPrefs, AiTopic, MusicPrefs } from "./types";
import { AI_TOPICS } from "./types";

const MUSIC_KEY = "news-app.music-prefs.v1";
const AI_KEY = "news-app.ai-prefs.v1";

const DEFAULT_MUSIC: MusicPrefs = {
  likedArtists: [],
  dislikedArtists: [],
  genres: [],
  lastSession: { updatedAt: new Date(0).toISOString() },
};

const DEFAULT_AI: AiPrefs = {
  topics: [],
  toolsInUse: [],
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
const aiListeners = new Set<Listener>();
let musicCache: MusicPrefs | null = null;
let aiCache: AiPrefs | null = null;

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

function readAi(): AiPrefs {
  if (typeof window === "undefined") return DEFAULT_AI;
  if (aiCache) return aiCache;
  const stored = safeParse<AiPrefs>(localStorage.getItem(AI_KEY), DEFAULT_AI);
  const cleanTopics = (stored.topics ?? []).filter((t): t is AiTopic =>
    (AI_TOPICS as readonly string[]).includes(t),
  );
  aiCache = {
    ...DEFAULT_AI,
    ...stored,
    topics: cleanTopics,
    lastSession: { ...DEFAULT_AI.lastSession, ...stored.lastSession },
  };
  return aiCache;
}

export function getMusicPrefs(): MusicPrefs {
  return readMusic();
}

export function getAiPrefs(): AiPrefs {
  return readAi();
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

export function setAiPrefs(next: AiPrefs): AiPrefs {
  const merged: AiPrefs = {
    ...next,
    lastSession: {
      ...next.lastSession,
      updatedAt: new Date().toISOString(),
    },
  };
  aiCache = merged;
  if (typeof window !== "undefined") {
    localStorage.setItem(AI_KEY, JSON.stringify(merged));
  }
  aiListeners.forEach((l) => l());
  return merged;
}

function subscribeMusic(listener: Listener): () => void {
  musicListeners.add(listener);
  return () => musicListeners.delete(listener);
}

function subscribeAi(listener: Listener): () => void {
  aiListeners.add(listener);
  return () => aiListeners.delete(listener);
}

export function useMusicPrefs(): MusicPrefs {
  return useSyncExternalStore(subscribeMusic, readMusic, () => DEFAULT_MUSIC);
}

export function useAiPrefs(): AiPrefs {
  return useSyncExternalStore(subscribeAi, readAi, () => DEFAULT_AI);
}
