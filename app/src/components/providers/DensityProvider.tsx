"use client";

import { useEffect } from "react";
import { usePrefsStore, resolveTheme } from "@/store/prefs.store";

/**
 * Applies the saved density + theme preferences to <html> (data-density,
 * data-theme). For "system" theme, follows the OS and live-updates on change.
 */
export function DensityProvider({ children }: { children: React.ReactNode }) {
  const density = usePrefsStore((s) => s.density);
  const theme = usePrefsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return <>{children}</>;
}
