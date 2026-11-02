"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient, ApiException } from "@/lib/apiClient";
import { countFor } from "@/lib/apiCounts";
import { Gap, GapStatus, PaginatedResult } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import {
  DatePill,
  DetailInfoCard,
  DetailList,
  DetailNote,
  DetailPanel,
  DetailRow,
  DetailSection,
  InlineStatusPill,
} from "@/components/DetailPanel";
import { SingleImage } from "@/components/ImageGallery";
import { Card, StatTile } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { toast } from "@/store/toastStore";
import { Activity, AlertOctagon, AlertTriangle, Camera, CheckCircle2, Info, MapPin, XCircle } from "lucide-react";

const LIMIT = 20;
const STATUS_FILTERS: (GapStatus | "ALL")[] = ["ALL", "OPEN", "RESOLVED", "DISMISSED"];

interface Counts {
  total: number;
  open: number;
  resolved: number;
  dismissed: number;
}

export default function GapsPage() {
  const [data, setData] = useState<PaginatedResult<Gap> | null>(null);
  const [status, setStatus] = useState<GapStatus | "ALL">("OPEN");
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewTarget, setReviewTarget] = useState<{ row: Gap; decision: GapStatus } | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Gap | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<PaginatedResult<Gap>>("/gaps", {
        limit: LIMIT,
        skip,
        ...(status !== "ALL" ? { status } : {}),
      });
      setData(result);
    } catch {
      toast.critical("Couldn't load compliance gaps — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [status, skip]);

  useEffect(() => {
    // load() sets loading/error state synchronously before its first
    // await — the standard fetch-on-mount-or-filter-change pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function refreshCounts() {
    try {
      const [open, resolved, dismissed] = await Promise.all([
        countFor("/gaps", { status: "OPEN" }),
        countFor("/gaps", { status: "RESOLVED" }),
        countFor("/gaps", { status: "DISMISSED" }),
      ]);
      setCounts({ total: open + resolved + dismissed, open, resolved, dismissed });
    } catch {
      // Stat tiles just stay blank — the table below already surfaces
      // a toast on its own load failure.
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCounts();
  }, []);

  async function submitDecision() {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await apiClient.patch(`/gaps/${reviewTarget.row.id}/status`, {
        status: reviewTarget.decision,
        ...(notes.trim() ? { resolutionNotes: notes.trim() } : {}),
      });
      setReviewTarget(null);
      setNotes("");
      load();
      refreshCounts();
    } catch (e) {
      toast.critical(e instanceof ApiException ? e.message : "Couldn't update status.");
    } finally {
      setSubmitting(false);
    }
  }

  // Same pattern as Enumerations' bulk bar: loops the existing single-row
  // PATCH /gaps/:id/status endpoint over the selected OPEN rows — there's
  // no bulk endpoint on the backend to call directly.
  async function bulkDecide(decision: GapStatus) {
    const targets = rows.filter((r) => selected.has(r.id) && r.status === "OPEN");
    if (targets.length === 0) return;
    setBulkSubmitting(true);
    try {
      const results = await Promise.allSettled(
        targets.map((row) => apiClient.patch(`/gaps/${row.id}/status`, { status: decision })),
      );
      const failures = results.filter((r) => r.status === "rejected").length;
      if (failures > 0) {
        toast.critical(`${failures} of ${targets.length} updates failed — the rest went through.`);
      }
      setSelected(new Set());
      load();
      refreshCounts();
    } finally {
      setBulkSubmitting(false);
    }
  }

  const rows = data?.items ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div>
      <PageHeader
        icon={AlertOctagon}
        title="Compliance Gaps"
        subtitle="Unregistered properties, and incorrect or duplicate records flagged in the field."
        tone="violet"
      />

      {counts && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total Reported" value={counts.total} icon={AlertOctagon} tone="blue" />
          <StatTile label="Open" value={counts.open} icon={AlertTriangle} tone="amber" />
          <StatTile label="Resolved" value={counts.resolved} icon={CheckCircle2} tone="teal" />
          <StatTile label="Dismissed" value={counts.dismissed} icon={XCircle} tone="violet" />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs
          options={STATUS_FILTERS}
          value={status}
          onChange={(s) => {
            setStatus(s);
            setSkip(0);
          }}
          getLabel={(s) => (s === "ALL" ? "All" : s)}
        />
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted">{selected.size} selected</span>
            <button
              type="button"
              onClick={() => bulkDecide("RESOLVED")}
              disabled={bulkSubmitting}
              className="rounded-full bg-status-good px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Resolve selected
            </button>
            <button
              type="button"
              onClick={() => bulkDecide("DISMISSED")}
              disabled={bulkSubmitting}
              className="rounded-full bg-status-critical px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Dismiss selected
            </button>
          </div>
        )}
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-white/5">
              <tr>
                <th className="w-10 px-5 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border accent-brand-secondary"
                    aria-label="Select all rows"
                  />
                </th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Reported By</th>
                <th className="px-5 py-3.5">Reported</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-muted">
                    No gaps match this filter.
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
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="h-4 w-4 rounded border-border accent-brand-secondary"
                        aria-label={`Select ${row.gapType} row`}
                      />
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">{row.gapType.replaceAll("_", " ")}</td>
                    <td className="max-w-xs px-5 py-4 text-foreground">
                      <p className="truncate">{row.description}</p>
                      {row.property?.pin && <p className="text-xs text-muted">{row.property.pin}</p>}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {row.address ?? row.property?.address ?? "—"}
                      {row.localGovernment && <span className="block text-xs">{row.localGovernment.name}</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.reporter?.fullName} />
                        <p className="truncate font-medium text-foreground">{row.reporter?.fullName ?? "—"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      {row.status === "OPEN" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setReviewTarget({ row, decision: "RESOLVED" })}
                            className="rounded-full bg-status-good px-3 py-1 text-xs font-semibold text-white"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => setReviewTarget({ row, decision: "DISMISSED" })}
                            className="rounded-full bg-status-critical px-3 py-1 text-xs font-semibold text-white"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {data && <Pagination total={data.total} limit={LIMIT} skip={skip} onSkipChange={setSkip} />}
      </Card>

      {reviewTarget && (
        <Modal
          title={reviewTarget.decision === "RESOLVED" ? "Resolve Gap" : "Dismiss Gap"}
          onClose={() => {
            setReviewTarget(null);
            setNotes("");
          }}
        >
          <p className="text-sm text-muted">{reviewTarget.row.description}</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Resolution notes (optional)"
            rows={3}
            className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
          />
          {reviewTarget.decision === "RESOLVED" && reviewTarget.row.gapType === "UNREGISTERED_PROPERTY" && (
            <p className="mt-2 text-xs text-muted">
              Note: linking the newly-registered property to this gap isn&apos;t wired up in this screen yet — register it
              under Properties first, then resolve this gap from the API/reference docs if you need that link recorded.
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setReviewTarget(null);
                setNotes("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={submitDecision}
              disabled={submitting}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                reviewTarget.decision === "RESOLVED" ? "bg-status-good" : "bg-status-critical"
              }`}
            >
              {submitting ? "Saving…" : reviewTarget.decision === "RESOLVED" ? "Confirm Resolve" : "Confirm Dismiss"}
            </button>
          </div>
        </Modal>
      )}

      {detailTarget && <GapDetailPanel gap={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}

function GapDetailPanel({ gap, onClose }: { gap: Gap; onClose: () => void }) {
  const tone = gap.status === "DISMISSED" ? "critical" : gap.status === "OPEN" ? "warning" : "good";
  return (
    <DetailPanel
      icon={AlertTriangle}
      iconTone={tone}
      title={gap.gapType.replaceAll("_", " ")}
      subtitle={gap.property?.pin ?? gap.address ?? undefined}
      badges={
        <>
          <InlineStatusPill status={gap.status} />
          <DatePill date={gap.createdAt} />
        </>
      }
      onClose={onClose}
    >
      <DetailSection title="Report Details" icon={Info} tone={tone}>
        <DetailInfoCard
          tone={tone}
          fields={[
            { label: "Type", value: gap.gapType.replaceAll("_", " ") },
            { label: "Reported By", value: gap.reporter?.fullName },
          ]}
        />
      </DetailSection>

      <DetailSection title="Gap Information" icon={Activity} tone={tone}>
        <DetailList>
          <DetailRow label="Description" value={gap.description} />
          <DetailRow
            label="Linked Property"
            value={gap.property ? `${gap.property.pin} — ${gap.property.address}` : null}
          />
          <DetailRow label="Address" value={gap.address} />
          <DetailRow label="Local Government" value={gap.localGovernment?.name} />
          <DetailRow
            label="Coordinates"
            icon={MapPin}
            value={gap.latitude != null && gap.longitude != null ? `${gap.latitude.toFixed(5)}, ${gap.longitude.toFixed(5)}` : null}
          />
          <DetailRow label="Reported" value={new Date(gap.createdAt).toLocaleString()} last />
        </DetailList>
      </DetailSection>

      <DetailSection title="Resolution" icon={Info} tone={tone}>
        <DetailNote tone={tone} text={gap.resolutionNotes} />
      </DetailSection>

      <DetailSection title="Photo" icon={Camera} tone={tone}>
        <SingleImage url={gap.photoUrl} alt="Gap evidence" emptyLabel="No photo" />
      </DetailSection>
    </DetailPanel>
  );
}
