import { LucideIcon } from "lucide-react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-sm dark:shadow-none ${className}`}>
      {children}
    </div>
  );
}

// "good"/"warning"/"critical" stay reserved for actual state (see
// StatusBadge) — never reused here for plain visual variety. The four
// extra tones below are identity colors, not status: a fixed-order
// categorical set (blue/teal/amber/violet, from the dataviz skill's
// validated palette) so each stat tile reads as its own distinct card,
// with a matching dark-mode step for each hue.
type StatTone = "neutral" | "good" | "warning" | "critical" | "blue" | "teal" | "amber" | "violet";

const TONE_CARD_CLASSES: Record<StatTone, string> = {
  neutral: "border-border bg-surface",
  good: "border-status-good/30 bg-status-good-bg",
  warning: "border-status-warning/30 bg-status-warning-bg",
  critical: "border-status-critical/30 bg-status-critical-bg",
  blue: "border-[#2a78d6]/25 bg-[#2a78d6]/[0.07] dark:border-[#3987e5]/30 dark:bg-[#3987e5]/[0.12]",
  teal: "border-[#1baf7a]/25 bg-[#1baf7a]/[0.07] dark:border-[#199e70]/30 dark:bg-[#199e70]/[0.12]",
  amber: "border-[#eda100]/25 bg-[#eda100]/[0.07] dark:border-[#c98500]/30 dark:bg-[#c98500]/[0.12]",
  violet: "border-[#6250d6]/25 bg-[#6250d6]/[0.07] dark:border-[#9085e9]/30 dark:bg-[#9085e9]/[0.12]",
};

const TONE_ICON_CIRCLE: Record<StatTone, string> = {
  neutral: "bg-foreground/10 text-foreground",
  good: "bg-status-good text-white",
  warning: "bg-status-warning text-white",
  critical: "bg-status-critical text-white",
  blue: "bg-[#2a78d6] text-white dark:bg-[#3987e5]",
  teal: "bg-[#1baf7a] text-white dark:bg-[#199e70]",
  amber: "bg-[#eda100] text-white dark:bg-[#c98500]",
  violet: "bg-[#6250d6] text-white dark:bg-[#9085e9]",
};

const TONE_GHOST_ICON: Record<StatTone, string> = {
  neutral: "text-foreground",
  good: "text-status-good",
  warning: "text-status-warning",
  critical: "text-status-critical",
  blue: "text-[#2a78d6] dark:text-[#3987e5]",
  teal: "text-[#1baf7a] dark:text-[#199e70]",
  amber: "text-[#eda100] dark:text-[#c98500]",
  violet: "text-[#6250d6] dark:text-[#9085e9]",
};

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  /** Small icon shown in a filled circle, plus a large faint version
      of the same icon in the background — both tinted by `tone`. */
  icon?: LucideIcon;
  tone?: StatTone;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${TONE_CARD_CLASSES[tone]}`}>
      {Icon && (
        <Icon
          size={128}
          strokeWidth={1.3}
          className={`pointer-events-none absolute -bottom-6 -right-6 opacity-[0.16] ${TONE_GHOST_ICON[tone]}`}
        />
      )}
      <div className="relative">
        {Icon && (
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${TONE_ICON_CIRCLE[tone]}`}>
            <Icon size={18} />
          </span>
        )}
        <p className="mt-4 text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-sm font-medium text-muted">{label}</p>
        {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}
