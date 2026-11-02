"use client";

import { useEffect } from "react";
import { Calendar, LucideIcon, X } from "lucide-react";
import { statusTone } from "./StatusBadge";

export { statusTone };
export type Tone = "good" | "warning" | "critical" | "neutral";

const TONE_SOLID: Record<Tone, string> = {
  good: "bg-status-good text-white",
  warning: "bg-status-warning text-[#1a1203]",
  critical: "bg-status-critical text-white",
  neutral: "bg-gray-400 text-white dark:bg-white/20",
};

const TONE_WASH: Record<Tone, string> = {
  good: "from-status-good-bg",
  warning: "from-status-warning-bg",
  critical: "from-status-critical-bg",
  neutral: "from-foreground/[0.06]",
};

const TONE_TINT_CARD: Record<Tone, string> = {
  good: "bg-status-good-bg",
  warning: "bg-status-warning-bg",
  critical: "bg-status-critical-bg",
  neutral: "bg-foreground/[0.04]",
};

const TONE_DOT: Record<Tone, string> = {
  good: "bg-status-good",
  warning: "bg-status-warning",
  critical: "bg-status-critical",
  neutral: "bg-gray-400 dark:bg-white/40",
};

/** "DELIVERED" -> "Delivered", "UNREGISTERED_PROPERTY" -> "Unregistered Property".
    Deliberately separate from StatusBadge's own uppercase table-pill style —
    the detail panel's header/row pills read better in title case. */
export function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

/**
 * A right-side slide-over panel for showing a single row's full detail —
 * distinct from `Modal.tsx` (a small centered dialog used for confirm/edit
 * forms). Used across the Properties/Enumerations/Deliveries/Gaps/Users
 * tables: clicking a row opens one of these with everything the table's
 * columns don't have room for.
 */
export function DetailPanel({
  icon: Icon,
  iconTone = "neutral",
  title,
  subtitle,
  badges,
  onClose,
  children,
}: {
  icon: LucideIcon;
  iconTone?: Tone;
  title: string;
  subtitle?: string | null;
  /** The status + date pill row shown just under the header. */
  badges?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-xl md:w-[480px]">
        <div className={`relative shrink-0 bg-gradient-to-br ${TONE_WASH[iconTone]} to-transparent px-6 pb-5 pt-6`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${TONE_SOLID[iconTone]}`}>
                <Icon size={24} />
              </span>
              <div className="min-w-0 pt-1">
                <h2 className="truncate text-lg font-bold text-foreground">{title}</h2>
                {subtitle && <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-muted transition hover:bg-foreground/10 hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
          {badges && <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div>}
        </div>
        <div className="flex-1 overflow-y-auto border-t border-border px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/** A filled pill (status) or a soft neutral pill (date/anything else) for
    the header's badge row. */
export function HeaderPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  /** Omit for the soft neutral style (e.g. the date pill); set for a
      filled status pill. */
  tone?: Tone;
}) {
  const style = tone
    ? `${TONE_SOLID[tone]}`
    : "bg-foreground/[0.06] text-foreground";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${style}`}>
      <Icon size={13} strokeWidth={2.5} />
      {label}
    </span>
  );
}

/** A date pill using the calendar icon — the common case for the
    header's second (non-status) badge. */
export function DatePill({ date }: { date: string }) {
  return <HeaderPill icon={Calendar} label={new Date(date).toLocaleString()} />;
}

/** A small colored status pill, title-cased, for use inline inside a
    divider-list row (smaller than the header's HeaderPill). */
export function InlineStatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_SOLID[tone]}`}>
      {titleCase(status)}
    </span>
  );
}

/** A colored dot + label, for a "Status" row inside a divider list. */
export function StatusDot({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
      <span className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
      {titleCase(status)}
    </span>
  );
}

/** A labeled `label: value` row — kept for any call site still using the
    plain stacked style (e.g. multi-line values like descriptions). */
export function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 text-sm text-foreground">{value || <span className="text-muted">—</span>}</div>
    </div>
  );
}

/** One row of a divider list: label left, value right — the base unit
    the "Information" sections (Delivery Information, Submission, etc.)
    are built from. */
export function DetailRow({
  label,
  value,
  icon: Icon,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  /** Shown immediately before the value, muted. */
  icon?: LucideIcon;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${last ? "" : "border-b border-border"}`}>
      <p className="shrink-0 text-sm text-muted">{label}</p>
      <div className="flex min-w-0 items-center gap-1.5 text-right text-sm font-semibold text-foreground">
        {Icon && <Icon size={14} className="shrink-0 text-muted" />}
        <span className="truncate">{value || <span className="font-normal text-muted">—</span>}</span>
      </div>
    </div>
  );
}

/** A section heading inside a detail panel: a small icon badge + bold
    title, used above every section (tinted card, divider list, or
    image block alike). */
export function DetailSection({
  title,
  icon: Icon,
  tone = "good",
  children,
}: {
  title: string;
  icon: LucideIcon;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${TONE_SOLID[tone]}`}>
          <Icon size={14} />
        </span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** The tinted 2-column "identity card" (e.g. Property Details) — a soft
    colored card holding a handful of label/value pairs. */
export function DetailInfoCard({
  tone = "good",
  fields,
}: {
  tone?: Tone;
  fields: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className={`grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl p-4 ${TONE_TINT_CARD[tone]}`}>
      {fields.map((field) => (
        <div key={field.label} className="min-w-0">
          <p className="text-xs font-semibold text-muted">{field.label}</p>
          <p className="mt-0.5 truncate text-sm font-bold text-foreground">
            {field.value || <span className="font-normal text-muted">—</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

/** A plain divider-list section body — rows separated by a thin bottom
    border, last row borderless. Wrap `DetailRow`s in this. */
export function DetailList({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

/** A tinted card for free-text notes (or "No additional notes"). */
export function DetailNote({ text, tone = "good" }: { text?: string | null; tone?: Tone }) {
  return (
    <div className={`rounded-xl p-4 ${TONE_TINT_CARD[tone]}`}>
      {text ? (
        <p className="text-sm text-foreground">{text}</p>
      ) : (
        <p className="text-sm italic text-muted">No additional notes available.</p>
      )}
    </div>
  );
}
