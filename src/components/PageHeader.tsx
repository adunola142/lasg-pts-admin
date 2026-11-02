import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type HeaderTone = "blue" | "teal" | "amber" | "violet";

const TONE_BAR: Record<HeaderTone, string> = {
  blue: "bg-[#2a78d6] dark:bg-[#3987e5]",
  teal: "bg-[#1baf7a] dark:bg-[#199e70]",
  amber: "bg-[#eda100] dark:bg-[#c98500]",
  violet: "bg-[#6250d6] dark:bg-[#9085e9]",
};

const TONE_BADGE: Record<HeaderTone, string> = {
  blue: "bg-[#2a78d6] dark:bg-[#3987e5]",
  teal: "bg-[#1baf7a] dark:bg-[#199e70]",
  amber: "bg-[#eda100] dark:bg-[#c98500]",
  violet: "bg-[#6250d6] dark:bg-[#9085e9]",
};

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  tone = "blue",
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tone?: HeaderTone;
  /** Optional right-aligned slot (e.g. a date-range button) that sits
      level with the title. */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-8 w-1.5 shrink-0 rounded-full ${TONE_BAR[tone]}`} />
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${TONE_BADGE[tone]}`}>
          <Icon size={20} />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
