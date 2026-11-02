"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

export interface DateRange {
  from: string; // ISO date, yyyy-mm-dd
  to: string; // ISO date, yyyy-mm-dd
}

interface Preset {
  label: string;
  days: number | null; // null = all time
}

const PRESETS: Preset[] = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time", days: null },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeFor(days: number | null): DateRange | null {
  if (days === null) return null;
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: isoDate(from), to: isoDate(to) };
}

/**
 * A real date-range filter — picks a preset window and reports it to the
 * parent via onChange, which is responsible for passing `from`/`to` through
 * to the search endpoints that now accept them (see SearchDeliveryDto etc.
 * on the backend). `value: null` means "all time" / no filter.
 */
export function DateRangeButton({
  value,
  onChange,
}: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const activePreset = PRESETS.find((p) => {
    const r = rangeFor(p.days);
    if (r === null) return value === null;
    return value?.from === r.from && value?.to === r.to;
  });
  const label = activePreset?.label ?? (value ? `${value.from} – ${value.to}` : "All time");

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/[0.03]"
      >
        <Calendar size={15} className="text-brand-secondary" />
        {label}
        <ChevronDown size={14} className={`text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange(rangeFor(preset.days));
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition hover:bg-foreground/[0.04] ${
                preset === activePreset ? "font-semibold text-brand-secondary" : "text-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
