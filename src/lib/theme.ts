export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "lasg_pts_admin_theme";

/**
 * Inlined into <head> as a synchronous script (see src/app/layout.tsx)
 * so the correct theme is set on <html> before first paint — avoids a
 * light-then-dark flash on reload for anyone who's picked dark mode.
 * Uses Tailwind's own documented class-based dark mode strategy (a
 * `dark` class on <html>, matched by `@custom-variant dark (&:is(.dark
 * *));` in globals.css) rather than a custom data attribute.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (e) {}
})();
`;

export function getStoredTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing / storage disabled — theme just won't persist
    // across reloads, which is fine, not worth surfacing to the user.
  }
}
