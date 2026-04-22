"use client";

import { SetupScreen } from "@/components/setup-screen";
import { setAiPrefs, useAiPrefs } from "@/lib/preferences";
import type { AiPrefs } from "@/lib/types";

export default function AiSetupPage() {
  const prefs = useAiPrefs();

  return (
    <SetupScreen
      category="ai"
      prefs={prefs}
      title="Novedades de IA"
      eyebrow="Novedades · IA"
      accentFrom="oklch(0.78 0.17 220)"
      accentTo="oklch(0.68 0.18 180)"
      feedHref="/ai/feed"
      onPrefsChange={(next) => {
        setAiPrefs(next as AiPrefs);
      }}
    />
  );
}
