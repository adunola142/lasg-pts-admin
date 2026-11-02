"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getStoredTheme, Theme } from "@/lib/theme";

/**
 * Reads the theme the inline init script (see src/app/layout.tsx)
 * already applied to <html> as its initial state, via a lazy useState
 * initializer rather than an effect-after-mount. That initializer only
 * runs with a real `document` on the client, so the very first client
 * render already shows the correct icon instead of needing a loading
 * placeholder that could get stuck if an effect never fired. It can
 * disagree with the server-rendered guess (the server always assumes
 * "light"), which React resolves by keeping the client's value —
 * `suppressHydrationWarning` below just silences the expected one-time
 * mismatch warning for that.
 *
 * Two variants: "icon" is the single sun/moon button that flips to the
 * opposite theme (used standalone, e.g. on the login page). "segmented"
 * is a two-button light/dark picker — both buttons always visible,
 * clicking one sets that theme explicitly rather than toggling — used
 * in the sidebar.
 */
export function ThemeToggle({
  className = "",
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "segmented";
}) {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  function set(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  if (variant === "segmented") {
    return (
      <div
        suppressHydrationWarning
        className={`inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] p-1 ${className}`}
      >
        <button
          type="button"
          onClick={() => set("light")}
          aria-label="Switch to light mode"
          title="Light mode"
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            theme === "light" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          <Sun size={14} />
        </button>
        <button
          type="button"
          onClick={() => set("dark")}
          aria-label="Switch to dark mode"
          title="Dark mode"
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            theme === "dark" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          <Moon size={14} />
        </button>
      </div>
    );
  }

  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => set(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      suppressHydrationWarning
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:text-foreground ${className}`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
