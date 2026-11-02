"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StatTile } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { DateRange, DateRangeButton } from "@/components/DateRangeButton";
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Clock3,
  AlertTriangle,
  BarChart3,
  ShieldAlert,
  Truck,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { TONE_HEX, statusTone } from "@/components/StatusBadge";
import { countFor } from "@/lib/apiCounts";
import { toast } from "@/store/toastStore";

interface Breakdown {
  total: number;
  byStatus: { status: string; count: number }[];
}

type BreakdownTone = "teal" | "amber";

const BREAKDOWN_BADGE: Record<BreakdownTone, string> = {
  teal: "bg-[#1baf7a] dark:bg-[#199e70]",
  amber: "bg-[#eda100] dark:bg-[#c98500]",
};

const BREAKDOWN_GHOST: Record<BreakdownTone, string> = {
  teal: "text-[#1baf7a] dark:text-[#199e70]",
  amber: "text-[#eda100] dark:text-[#c98500]",
};

function BreakdownBars({
  title,
  data,
  icon: Icon,
  tone,
  href,
}: {
  title: string;
  data: Breakdown;
  icon: LucideIcon;
  tone: BreakdownTone;
  href: string;
}) {
  const max = Math.max(1, ...data.byStatus.map((s) => s.count));
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5">
      <Icon size={128} strokeWidth={1.3} className={`pointer-events-none absolute -bottom-6 -right-6 opacity-[0.08] ${BREAKDOWN_GHOST[tone]}`} />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${BREAKDOWN_BADGE[tone]}`}>
            <Icon size={16} />
          </span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-semibold text-brand-secondary transition hover:opacity-80"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </div>
      <div className="relative mt-4 flex flex-col gap-3">
        {data.byStatus.map(({ status, count }) => {
          const statTone = statusTone(status);
          const pct = Math.round((count / max) * 100);
          return (
            <div key={status}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-muted">{status.replaceAll("_", " ")}</span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: TONE_HEX[statTone] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [propertiesTotal, setPropertiesTotal] = useState(0);
  const [enumerations, setEnumerations] = useState<Breakdown | null>(null);
  const [gaps, setGaps] = useState<Breakdown | null>(null);
  const [deliveries, setDeliveries] = useState<Breakdown | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const range = dateRange ?? {};
    try {
      const [propsTotal, pending, verified, rejected, open, resolved, dismissed, delivered, failed, rescheduled] =
        await Promise.all([
          countFor("/properties", range),
          countFor("/enumerations", { status: "PENDING", ...range }),
          countFor("/enumerations", { status: "VERIFIED", ...range }),
          countFor("/enumerations", { status: "REJECTED", ...range }),
          countFor("/gaps", { status: "OPEN", ...range }),
          countFor("/gaps", { status: "RESOLVED", ...range }),
          countFor("/gaps", { status: "DISMISSED", ...range }),
          countFor("/deliveries", { status: "DELIVERED", ...range }),
          countFor("/deliveries", { status: "FAILED", ...range }),
          countFor("/deliveries", { status: "RESCHEDULED", ...range }),
        ]);

      setPropertiesTotal(propsTotal);
      setEnumerations({
        total: pending + verified + rejected,
        byStatus: [
          { status: "PENDING", count: pending },
          { status: "VERIFIED", count: verified },
          { status: "REJECTED", count: rejected },
        ],
      });
      setGaps({
        total: open + resolved + dismissed,
        byStatus: [
          { status: "OPEN", count: open },
          { status: "RESOLVED", count: resolved },
          { status: "DISMISSED", count: dismissed },
        ],
      });
      setDeliveries({
        total: delivered + failed + rescheduled,
        byStatus: [
          { status: "DELIVERED", count: delivered },
          { status: "FAILED", count: failed },
          { status: "RESCHEDULED", count: rescheduled },
        ],
      });
    } catch {
      toast.critical("Couldn't load reporting data — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    // load() sets loading/error state synchronously before its first
    // await — the standard fetch-on-mount-or-filter-change pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Overview"
        subtitle="Live counts straight from the backend — nothing here is mocked."
        tone="blue"
        action={<DateRangeButton value={dateRange} onChange={setDateRange} />}
      />
      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {!loading && enumerations && gaps && deliveries && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Properties Registered" value={propertiesTotal} icon={Building2} tone="blue" />
            <StatTile
              label="Enumerations Submitted"
              value={enumerations.total}
              icon={ClipboardCheck}
              tone="teal"
            />
            <StatTile
              label="Pending Review"
              value={enumerations.byStatus.find((s) => s.status === "PENDING")?.count ?? 0}
              hint="Awaiting supervisor verification"
              icon={Clock3}
              tone="amber"
            />
            <StatTile
              label="Open Compliance Gaps"
              value={gaps.byStatus.find((s) => s.status === "OPEN")?.count ?? 0}
              hint="Not yet resolved or dismissed"
              icon={AlertTriangle}
              tone="violet"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BreakdownBars title="Enumerations by Status" data={enumerations} icon={BarChart3} tone="teal" href="/enumerations" />
            <BreakdownBars title="Compliance Gaps by Status" data={gaps} icon={ShieldAlert} tone="amber" href="/gaps" />
            <BreakdownBars title="Deliveries by Status" data={deliveries} icon={Truck} tone="teal" href="/deliveries" />
          </div>
        </>
      )}
    </div>
  );
}
