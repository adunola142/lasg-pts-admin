"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient, ApiException } from "@/lib/apiClient";
import { countFor } from "@/lib/apiCounts";
import { Enumeration, EnumerationStatus, PaginatedResult } from "@/lib/types";
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
import { ImageGallery, SingleImage } from "@/components/ImageGallery";
import { Card, StatTile } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import {
  Activity,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Home,
  Info,
  MapPin,
  PenTool,
  Phone,
  XCircle,
} from "lucide-react";

const LIMIT = 20;
const STATUS_FILTERS: (EnumerationStatus | "ALL")[] = ["ALL", "PENDING", "VERIFIED", "REJECTED"];

interface Counts {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

export default function EnumerationsPage() {
  const { user } = useAuthStore();
  const canReview = user?.role === "ADMIN" || user?.role === "SUPERVISOR";

  const [data, setData] = useState<PaginatedResult<Enumeration> | null>(null);
  const [status, setStatus] = useState<EnumerationStatus | "ALL">("PENDING");
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewTarget, setReviewTarget] = useState<{ row: Enumeration; decision: EnumerationStatus } | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Enumeration | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<PaginatedResult<Enumeration>>("/enumerations", {
        limit: LIMIT,
        skip,
        ...(status !== "ALL" ? { status } : {}),
      });
      setData(result);
    } catch {
      toast.critical("Couldn't load enumerations — check your connection and try again.");
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
      const [pending, verified, rejected] = await Promise.all([
        countFor("/enumerations", { status: "PENDING" }),
        countFor("/enumerations", { status: "VERIFIED" }),
        countFor("/enumerations", { status: "REJECTED" }),
      ]);
      setCounts({ total: pending + verified + rejected, pending, verified, rejected });
    } catch {
      // Stat tiles just stay blank — the table below already surfaces
      // a toast on its own load failure.
    }
  }

  useEffect(() => {
    // Unfiltered totals for the stat-tile ribbon, independent of the
    // tab/pagination state above — fetched once on mount and again
    // after any review decision changes a row's status.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCounts();
  }, []);

  async function submitDecision() {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await apiClient.patch(`/enumerations/${reviewTarget.row.id}/status`, {
        status: reviewTarget.decision,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
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

  // Applies the same single-row PATCH /enumerations/:id/status the
  // Verify/Reject buttons use, once per selected PENDING row — there's no
  // bulk endpoint on the backend, so this is a real (if sequential) bulk
  // action built from the real one, not a mocked "bulk approve".
  async function bulkDecide(decision: EnumerationStatus) {
    const targets = rows.filter((r) => selected.has(r.id) && r.status === "PENDING");
    if (targets.length === 0) return;
    setBulkSubmitting(true);
    try {
      const results = await Promise.allSettled(
        targets.map((row) => apiClient.patch(`/enumerations/${row.id}/status`, { status: decision })),
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
        icon={ClipboardList}
        title="Enumerations"
        subtitle={
          canReview
            ? "Field-agent property surveys. Verify or reject pending submissions."
            : "Field-agent property surveys. Read-only — auditors cannot change status."
        }
        tone="teal"
      />

      {counts && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total Submitted" value={counts.total} icon={ClipboardList} tone="blue" />
          <StatTile label="Pending Review" value={counts.pending} icon={Clock3} tone="amber" />
          <StatTile label="Verified" value={counts.verified} icon={CheckCircle2} tone="teal" />
          <StatTile label="Rejected" value={counts.rejected} icon={XCircle} tone="violet" />
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
        {canReview && selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted">{selected.size} selected</span>
            <button
              type="button"
              onClick={() => bulkDecide("VERIFIED")}
              disabled={bulkSubmitting}
              className="rounded-full bg-status-good px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Verify selected
            </button>
            <button
              type="button"
              onClick={() => bulkDecide("REJECTED")}
              disabled={bulkSubmitting}
              className="rounded-full bg-status-critical px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Reject selected
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
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Owner</th>
                <th className="px-5 py-3.5">Occupancy</th>
                <th className="px-5 py-3.5">Enumerator</th>
                <th className="px-5 py-3.5">Submitted</th>
                <th className="px-5 py-3.5">Status</th>
                {canReview && <th className="px-5 py-3.5">Actions</th>}
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
                    No enumerations match this filter.
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
                        aria-label={`Select ${row.property?.pin ?? "row"}`}
                      />
                    </td>
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
                      <p className="font-semibold text-foreground">{row.ownerName}</p>
                      <p className="text-xs text-muted">{row.ownerPhone}</p>
                    </td>
                    <td className="px-5 py-4 text-foreground">{row.occupancyStatus.replaceAll("_", " ")}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.enumerator?.fullName} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{row.enumerator?.fullName ?? "—"}</p>
                          <p className="truncate text-xs text-muted">Enumerator</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    {canReview && (
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {row.status === "PENDING" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setReviewTarget({ row, decision: "VERIFIED" })}
                              className="rounded-full bg-status-good px-3 py-1 text-xs font-semibold text-white"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => setReviewTarget({ row, decision: "REJECTED" })}
                              className="rounded-full bg-status-critical px-3 py-1 text-xs font-semibold text-white"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Reviewed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {data && <Pagination total={data.total} limit={LIMIT} skip={skip} onSkipChange={setSkip} />}
      </Card>

      {reviewTarget && (
        <Modal
          title={reviewTarget.decision === "VERIFIED" ? "Verify Enumeration" : "Reject Enumeration"}
          onClose={() => {
            setReviewTarget(null);
            setNotes("");
          }}
        >
          <p className="text-sm text-muted">
            {reviewTarget.row.property?.pin} — {reviewTarget.row.ownerName}
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional) — why was this verified or rejected?"
            rows={3}
            className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
          />
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
                reviewTarget.decision === "VERIFIED" ? "bg-status-good" : "bg-status-critical"
              }`}
            >
              {submitting ? "Saving…" : reviewTarget.decision === "VERIFIED" ? "Confirm Verify" : "Confirm Reject"}
            </button>
          </div>
        </Modal>
      )}

      {detailTarget && <EnumerationDetailPanel enumeration={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}

function EnumerationDetailPanel({ enumeration, onClose }: { enumeration: Enumeration; onClose: () => void }) {
  return (
    <DetailPanel
      icon={ClipboardList}
      iconTone={enumeration.status === "REJECTED" ? "critical" : enumeration.status === "PENDING" ? "warning" : "good"}
      title={enumeration.property?.pin ?? "Enumeration"}
      subtitle={enumeration.property?.address}
      badges={
        <>
          <InlineStatusPill status={enumeration.status} />
          <DatePill date={enumeration.createdAt} />
        </>
      }
      onClose={onClose}
    >
      <DetailSection title="Property Details" icon={Home} tone="good">
        <DetailInfoCard
          fields={[
            { label: "PIN", value: enumeration.property?.pin },
            { label: "Address", value: enumeration.property?.address },
          ]}
        />
      </DetailSection>

      <DetailSection title="Owner Information" icon={Info} tone="good">
        <DetailList>
          <DetailRow label="Name" value={enumeration.ownerName} />
          <DetailRow label="Phone" icon={Phone} value={enumeration.ownerPhone} />
          <DetailRow label="Email" value={enumeration.ownerEmail} />
          <DetailRow label="Occupancy" value={enumeration.occupancyStatus.replaceAll("_", " ")} last />
        </DetailList>
      </DetailSection>

      <DetailSection title="Building Information" icon={Activity} tone="good">
        <DetailList>
          <DetailRow label="Type" value={enumeration.buildingType} />
          <DetailRow
            label="Floors / Units"
            value={
              enumeration.numberOfFloors != null || enumeration.numberOfUnits != null
                ? `${enumeration.numberOfFloors ?? "—"} floors · ${enumeration.numberOfUnits ?? "—"} units`
                : null
            }
          />
          <DetailRow
            label="Captured Coordinates"
            icon={MapPin}
            value={
              enumeration.capturedLatitude != null && enumeration.capturedLongitude != null
                ? `${enumeration.capturedLatitude.toFixed(5)}, ${enumeration.capturedLongitude.toFixed(5)}`
                : null
            }
          />
          <DetailRow label="Enumerator" value={enumeration.enumerator?.fullName} last />
        </DetailList>
      </DetailSection>

      <DetailSection title="Notes" icon={Info} tone="good">
        <DetailNote text={enumeration.notes} />
      </DetailSection>

      <DetailSection title="Photos" icon={Camera} tone="good">
        <ImageGallery urls={enumeration.photoUrls} />
      </DetailSection>

      <DetailSection title="Signature" icon={PenTool} tone="good">
        <SingleImage url={enumeration.signatureUrl} alt="Owner signature" emptyLabel="Not captured" />
      </DetailSection>
    </DetailPanel>
  );
}
