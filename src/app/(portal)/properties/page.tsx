"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Enumeration, PaginatedResult, Property } from "@/lib/types";
import { Pagination } from "@/components/Pagination";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import {
  DatePill,
  DetailInfoCard,
  DetailList,
  DetailPanel,
  DetailRow,
  DetailSection,
} from "@/components/DetailPanel";
import { ImageGallery } from "@/components/ImageGallery";
import { toast } from "@/store/toastStore";
import { Activity, Building2, FileText, Home, MapPin, Phone, Search, User as UserIcon } from "lucide-react";

const LIMIT = 20;

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PaginatedResult<Property> | null>(null);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailTarget, setDetailTarget] = useState<Property | null>(null);

  useEffect(() => {
    // Picks up a search term handed over from the TopBar's search dropdown
    // (?q=...) — read once on mount, client-side only, so this never needs
    // a Suspense boundary around useSearchParams.
    const q = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setSearch(q);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<PaginatedResult<Property>>("/properties", {
        limit: LIMIT,
        skip,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setData(result);
    } catch {
      toast.critical("Couldn't load properties — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [search, skip]);

  useEffect(() => {
    // load() sets loading/error state synchronously before its first
    // await — the standard fetch-on-mount-or-filter-change pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const rows = data?.items ?? [];

  return (
    <div>
      <PageHeader icon={Home} title="Properties" subtitle="Search the property register by PIN or address." tone="amber" />

      <div className="relative mt-5 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSkip(0);
          }}
          placeholder="Search by PIN or address…"
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
        />
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted dark:bg-white/5">
              <tr>
                <th className="px-5 py-3.5">PIN</th>
                <th className="px-5 py-3.5">Address</th>
                <th className="px-5 py-3.5">Local Government</th>
                <th className="px-5 py-3.5">Usage</th>
                <th className="px-5 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    No properties match this search.
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
                        <span className="font-semibold text-foreground">{row.pin}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground">{row.address}</td>
                    <td className="px-5 py-4 text-muted">{row.localGovernment?.name ?? "—"}</td>
                    <td className="px-5 py-4 text-muted">{row.propertyUsage?.name ?? "—"}</td>
                    <td className="px-5 py-4 text-muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {data && <Pagination total={data.total} limit={LIMIT} skip={skip} onSkipChange={setSkip} />}
      </Card>

      {detailTarget && <PropertyDetailPanel property={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}

function PropertyDetailPanel({ property, onClose }: { property: Property; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [enumeration, setEnumeration] = useState<Enumeration | null>(null);
  const [deliveryCount, setDeliveryCount] = useState<number | null>(null);
  const [gapCount, setGapCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [enumerations, deliveries, gaps] = await Promise.all([
          apiClient.get<PaginatedResult<Enumeration>>("/enumerations", { propertyId: property.id, limit: 1 }),
          apiClient.get<PaginatedResult<unknown>>("/deliveries", { propertyId: property.id, limit: 1 }),
          apiClient.get<PaginatedResult<unknown>>("/gaps", { propertyId: property.id, limit: 1 }),
        ]);
        if (cancelled) return;
        setEnumeration(enumerations.items[0] ?? null);
        setDeliveryCount(deliveries.total);
        setGapCount(gaps.total);
      } catch {
        // The property's own fields (already in hand) still render —
        // only the enumeration/delivery/gap lookups below are affected.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [property.id]);

  return (
    <DetailPanel
      icon={Home}
      iconTone="neutral"
      title={property.pin}
      subtitle={property.address}
      badges={<DatePill date={property.createdAt} />}
      onClose={onClose}
    >
      <DetailSection title="Property Details" icon={FileText} tone="neutral">
        <DetailInfoCard
          tone="neutral"
          fields={[
            { label: "PIN", value: property.pin },
            { label: "Address", value: property.address },
          ]}
        />
      </DetailSection>

      <DetailSection title="Registration" icon={Activity} tone="neutral">
        <DetailList>
          <DetailRow label="Payment Code" value={property.paymentCode} />
          <DetailRow label="Local Government" value={property.localGovernment?.name} />
          <DetailRow label="Usage" value={property.propertyUsage?.name} />
          <DetailRow
            label="Coordinates"
            icon={MapPin}
            value={
              property.latitude != null && property.longitude != null
                ? `${property.latitude.toFixed(5)}, ${property.longitude.toFixed(5)}`
                : null
            }
          />
          <DetailRow label="Registered" value={new Date(property.createdAt).toLocaleString()} last />
        </DetailList>
      </DetailSection>

      {!loading && (deliveryCount !== null || gapCount !== null) && (
        <DetailSection title="Activity" icon={Activity} tone="neutral">
          <p className="text-sm text-muted">
            {deliveryCount ?? 0} {deliveryCount === 1 ? "delivery" : "deliveries"} · {gapCount ?? 0}{" "}
            {gapCount === 1 ? "gap" : "gaps"}
          </p>
        </DetailSection>
      )}

      <DetailSection title="Enumeration" icon={UserIcon} tone="neutral">
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : enumeration ? (
          <>
            <DetailList>
              <DetailRow label="Owner" value={enumeration.ownerName} />
              <DetailRow label="Owner Phone" icon={Phone} value={enumeration.ownerPhone} />
              <DetailRow label="Owner Email" value={enumeration.ownerEmail} />
              <DetailRow label="Occupancy" value={enumeration.occupancyStatus.replaceAll("_", " ")} />
              <DetailRow label="Building Type" value={enumeration.buildingType} />
              <DetailRow
                label="Floors / Units"
                value={
                  enumeration.numberOfFloors != null || enumeration.numberOfUnits != null
                    ? `${enumeration.numberOfFloors ?? "—"} floors · ${enumeration.numberOfUnits ?? "—"} units`
                    : null
                }
                last
              />
            </DetailList>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Photos</p>
              <div className="mt-1.5">
                <ImageGallery urls={enumeration.photoUrls} />
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">No enumeration on file yet.</p>
        )}
      </DetailSection>
    </DetailPanel>
  );
}
