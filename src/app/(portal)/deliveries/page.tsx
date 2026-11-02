"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { countFor } from "@/lib/apiCounts";
import { Delivery, DeliveryStatus, ManagedUser, PaginatedResult } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { Card, StatTile } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import {
  DatePill,
  DetailInfoCard,
  DetailList,
  DetailNote,
  DetailPanel,
  DetailRow,
  DetailSection,
  InlineStatusPill,
  StatusDot,
} from "@/components/DetailPanel";
import { SingleImage } from "@/components/ImageGallery";
import { DateRange, DateRangeButton } from "@/components/DateRangeButton";
import { Avatar } from "@/components/Avatar";
import { toast } from "@/store/toastStore";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import {
  Activity,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Download,
  Filter,
  Info,
  MapPin,
  MoreVertical,
  PenTool,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";

const LIMIT = 20;
const STATUS_FILTERS: (DeliveryStatus | "ALL")[] = ["ALL", "DELIVERED", "FAILED", "RESCHEDULED"];
// Safety cap on how many rows a single CSV export will pull — well above
// any realistic delivery volume for one filtered view, but keeps a
// mistaken "export everything" click from looping forever.
const EXPORT_CAP = 5000;

interface Counts {
  total: number;
  delivered: number;
  failed: number;
  rescheduled: number;
}

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Read-only — there's no status-update endpoint for deliveries on the
// backend (status is set once, at creation, by the delivery agent).
export default function DeliveriesPage() {
  const [data, setData] = useState<PaginatedResult<Delivery> | null>(null);
  const [status, setStatus] = useState<DeliveryStatus | "ALL">("ALL");
  const [agentId, setAgentId] = useState<string | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [agents, setAgents] = useState<ManagedUser[]>([]);
  const [exporting, setExporting] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Delivery | null>(null);

  const filters = useCallback(
    () => ({
      ...(status !== "ALL" ? { status } : {}),
      ...(agentId !== "ALL" ? { deliveryAgentId: agentId } : {}),
      ...(dateRange ?? {}),
    }),
    [status, agentId, dateRange],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<PaginatedResult<Delivery>>("/deliveries", {
        limit: LIMIT,
        skip,
        ...filters(),
      });
      setData(result);
    } catch {
      toast.critical("Couldn't load deliveries — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [filters, skip]);

  useEffect(() => {
    // load() sets loading/error state synchronously before its first
    // await — the standard fetch-on-mount-or-filter-change pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // The stat-tile ribbon reflects the same agent/date filters as the table,
  // just independent of the status tab and pagination.
  useEffect(() => {
    (async () => {
      try {
        const range = { ...(agentId !== "ALL" ? { deliveryAgentId: agentId } : {}), ...(dateRange ?? {}) };
        const [delivered, failed, rescheduled] = await Promise.all([
          countFor("/deliveries", { status: "DELIVERED", ...range }),
          countFor("/deliveries", { status: "FAILED", ...range }),
          countFor("/deliveries", { status: "RESCHEDULED", ...range }),
        ]);
        setCounts({ total: delivered + failed + rescheduled, delivered, failed, rescheduled });
      } catch {
        // Stat tiles just stay blank — the table below still loads and
        // already surfaces a toast on its own failure.
      }
    })();
  }, [agentId, dateRange]);

  // The delivery-agent list for the Filter dropdown — real accounts, not a
  // mocked roster: GET /users?role=DELIVERY_AGENT (same endpoint Users
  // management uses), fetched once on mount.
  useEffect(() => {
    (async () => {
      try {
        const result = await apiClient.get<PaginatedResult<ManagedUser>>("/users", {
          role: "DELIVERY_AGENT",
          limit: 100,
        });
        setAgents(result.items);
      } catch {
        // The Filter dropdown just falls back to "All agents" — nothing
        // else on the page depends on this list.
      }
    })();
  }, []);

  async function exportCsv() {
    setExporting(true);
    try {
      const rows: Delivery[] = [];
      let fetchSkip = 0;
      // Pulls every row matching the current filters, not just the page
      // on screen — paginating through the same real endpoint the table
      // uses, capped at EXPORT_CAP as a sanity limit.
      while (rows.length < EXPORT_CAP) {
        const page = await apiClient.get<PaginatedResult<Delivery>>("/deliveries", {
          limit: 100,
          skip: fetchSkip,
          ...filters(),
        });
        rows.push(...page.items);
        if (rows.length >= page.total || page.items.length === 0) break;
        fetchSkip += 100;
      }

      if (rows.length === 0) {
        toast.critical("No deliveries match the current filters — nothing to export.");
        return;
      }

      downloadCsv(`deliveries-${new Date().toISOString().slice(0, 10)}.csv`, [
        ["Property PIN", "Address", "Agent", "Receiver", "Status", "Date"],
        ...rows.map((row) => [
          row.property?.pin ?? "",
          row.property?.address ?? "",
          row.deliveryAgent?.fullName ?? "",
          row.receiverName ?? (row.status === "FAILED" ? row.failureReason ?? "" : ""),
          row.status,
          new Date(row.createdAt).toLocaleString(),
        ]),
      ]);
    } catch {
      toast.critical("Couldn't export deliveries — check your connection and try again.");
    } finally {
      setExporting(false);
    }
  }

  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader icon={Truck} title="Deliveries" subtitle="Physical tax-notice delivery records. Read-only." tone="blue" />

      {counts && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total Deliveries" value={counts.total} icon={Truck} tone="blue" />
          <StatTile label="Delivered" value={counts.delivered} icon={CheckCircle2} tone="teal" />
          <StatTile label="Failed" value={counts.failed} icon={XCircle} tone="violet" />
          <StatTile label="Rescheduled" value={counts.rescheduled} icon={Calendar} tone="amber" />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Delivery Records</h2>
          <p className="text-sm text-muted">Manage and view all delivery records</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeButton value={dateRange} onChange={setDateRange} />

          <div className="relative">
            <Filter
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <select
              value={agentId}
              onChange={(e) => {
                setAgentId(e.target.value);
                setSkip(0);
              }}
              className="appearance-none rounded-xl border border-border px-3.5 py-2 pl-8 text-sm font-medium text-foreground outline-none transition hover:bg-foreground/[0.03] focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
            >
              <option value="ALL">All agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.fullName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-brand-secondary px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <Download size={15} />
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <SegmentedTabs
          options={STATUS_FILTERS}
          value={status}
          onChange={(s) => {
            setStatus(s);
            setSkip(0);
          }}
          getLabel={(s) => (s === "ALL" ? "All" : s)}
        />
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-white/5">
              <tr>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Agent</th>
                <th className="px-5 py-3.5">Receiver</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="w-10 px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    No deliveries match this filter.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setDetailTarget(row)}
                    className="cursor-pointer transition hover:bg-foreground/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-muted">
                          <Building2 size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{row.property?.pin ?? "—"}</p>
                          <p className="truncate text-xs text-muted">{row.property?.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.deliveryAgent?.fullName} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{row.deliveryAgent?.fullName ?? "—"}</p>
                          <p className="truncate text-xs text-muted">Field Agent</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      {row.receiverName ?? (row.status === "FAILED" ? row.failureReason : "—")}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {new Date(row.createdAt).toLocaleDateString()}
                      <span className="block text-xs">
                        {new Date(row.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
                        aria-label="Row actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {data && <Pagination total={data.total} limit={LIMIT} skip={skip} onSkipChange={setSkip} />}
      </Card>

      {detailTarget && <DeliveryDetailPanel delivery={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}

function DeliveryDetailPanel({ delivery, onClose }: { delivery: Delivery; onClose: () => void }) {
  return (
    <DetailPanel
      icon={Truck}
      iconTone="good"
      title={delivery.property?.pin ?? "Delivery"}
      subtitle={delivery.property?.address}
      badges={
        <>
          <InlineStatusPill status={delivery.status} />
          <DatePill date={delivery.createdAt} />
        </>
      }
      onClose={onClose}
    >
      <DetailSection title="Property Details" icon={Info} tone="good">
        <DetailInfoCard
          fields={[
            { label: "PIN", value: delivery.property?.pin },
            { label: "Address", value: delivery.property?.address },
          ]}
        />
      </DetailSection>

      <DetailSection title="Delivery Information" icon={Activity} tone="good">
        <DetailList>
          <DetailRow label="Outcome" value={<InlineStatusPill status={delivery.status} />} />
          <DetailRow label="Status" value={<StatusDot status={delivery.status} />} />
          <DetailRow label="Agent" value={delivery.deliveryAgent?.fullName} />
          <DetailRow label="Receiver" value={delivery.receiverName} />
          <DetailRow label="Receiver Phone" icon={Phone} value={delivery.receiverPhone} />
          <DetailRow label="Relationship to Owner" value={delivery.relationshipToOwner} />
          {delivery.status === "FAILED" && <DetailRow label="Failure Reason" value={delivery.failureReason} />}
          <DetailRow
            label="Captured Coordinates"
            icon={MapPin}
            value={
              delivery.capturedLatitude != null && delivery.capturedLongitude != null
                ? `${delivery.capturedLatitude.toFixed(5)}, ${delivery.capturedLongitude.toFixed(5)}`
                : null
            }
          />
          <DetailRow label="Date" icon={Calendar} value={new Date(delivery.createdAt).toLocaleString()} last />
        </DetailList>
      </DetailSection>

      <DetailSection title="Notes" icon={Info} tone="good">
        <DetailNote text={delivery.notes} />
      </DetailSection>

      <DetailSection title="Photo" icon={Camera} tone="good">
        <SingleImage url={delivery.photoUrl} alt="Delivery evidence" emptyLabel="Not captured" />
      </DetailSection>

      <DetailSection title="Signature" icon={PenTool} tone="good">
        <SingleImage url={delivery.signatureUrl} alt="Receiver signature" emptyLabel="Not captured" />
      </DetailSection>
    </DetailPanel>
  );
}
