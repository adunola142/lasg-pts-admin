// Deterministic "pick a color for this person" — used for agent/owner/
// reporter/enumerator avatar chips across the table pages so the same
// name always gets the same color without storing one anywhere. Pulls
// from the same validated categorical palette as the stat-tile tones
// (see Card.tsx), using the dark-mode step of each hue since that step
// reads clearly with white text on both a light and a dark page
// background.
const AVATAR_COLORS = [
  "#3987e5", // blue
  "#199e70", // teal
  "#9085e9", // violet
  "#d95926", // orange
  "#d55181", // magenta
  "#c98500", // amber
];

export function initials(name?: string | null, fallback?: string | null): string {
  const source = (name ?? fallback ?? "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

export function avatarColor(name?: string | null): string {
  const source = (name ?? "").trim() || "?";
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
