"use client";

/**
 * A pill-shaped segmented control — one rounded-full dark/surface-tinted
 * track holding the options, with the active one as a solid inverted
 * pill (foreground-on-background) rather than a colored button. Matches
 * the tab/filter language of the reference dashboard design more
 * closely than a row of separately-colored buttons.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  getLabel = (v) => v,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  getLabel?: (value: T) => string;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-surface p-1">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              active ? "bg-foreground text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {getLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
