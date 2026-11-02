import { initials, avatarColor } from "@/lib/avatar";

/** Small colored initials chip — see src/lib/avatar.ts for how the
    color and initials are picked. Used for agents, owners, reporters,
    and enumerators across every table page. */
export function Avatar({ name, fallback, size = 36 }: { name?: string | null; fallback?: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: avatarColor(name ?? fallback) }}
    >
      {initials(name, fallback)}
    </span>
  );
}
