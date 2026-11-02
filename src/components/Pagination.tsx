"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// Windowed page list: always show page 1-2, the last 2 pages, and the
// current page ± 1, collapsing the rest behind an ellipsis — the same
// pattern as the reference dashboard's "1 2 3 4 5 … 50" pager.
function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({
  total,
  limit,
  skip,
  onSkipChange,
}: {
  total: number;
  limit: number;
  skip: number;
  onSkipChange: (skip: number) => void;
}) {
  const page = Math.floor(skip / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const goTo = (p: number) => onSkipChange((p - 1) * limit);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 text-sm">
      <span className="text-muted">
        {total === 0 ? "No results" : `Showing ${skip + 1}–${Math.min(skip + limit, total)} of ${total} records`}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => goTo(page - 1)}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:text-foreground disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        {pageList(page, pageCount).map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                p === page
                  ? "bg-brand-secondary text-white"
                  : "text-muted hover:bg-foreground/[0.05] hover:text-foreground"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page === pageCount}
          onClick={() => goTo(page + 1)}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:text-foreground disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
