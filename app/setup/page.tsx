"use client";

import { SetupScreen } from "@/components/setup-screen";
import { setMusicPrefs, useMusicPrefs } from "@/lib/preferences";

export default function SetupPage() {
  const prefs = useMusicPrefs();

  return (
    <SetupScreen
      prefs={prefs}
      accentFrom="oklch(0.72 0.25 330)"
      accentTo="oklch(0.62 0.22 290)"
      feedHref="/feed"
      onPrefsChange={(next) => setMusicPrefs(next)}
    />
  );
}
