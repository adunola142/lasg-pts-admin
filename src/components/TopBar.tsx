"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Building2, ChevronDown, LogOut, Search, User as UserIcon } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { ManagedUser, PaginatedResult, Property, User } from "@/lib/types";
import { initials } from "@/lib/avatar";

interface SearchResults {
  properties: Property[];
  users: ManagedUser[];
}

// Real search against the two endpoints that already support free-text
// matching (GET /properties?search=, GET /users?search= — see
// SearchPropertyDto/SearchUserDto on the backend). There's no single
// cross-entity search endpoint, so this fans out to both and shows a
// grouped dropdown; picking a result jumps to that record's list page
// with the term carried over via ?q=.
export function TopBar({ user, onLogout }: { user: User; onLogout: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [properties, users] = await Promise.all([
          apiClient.get<PaginatedResult<Property>>("/properties", { search: term, limit: 5 }),
          apiClient.get<PaginatedResult<ManagedUser>>("/users", { search: term, limit: 5 }),
        ]);
        setResults({ properties: properties.items, users: users.items });
      } catch {
        setResults({ properties: [], users: [] });
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResultsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToProperty(property: Property) {
    setResultsOpen(false);
    setSearch("");
    router.push(`/properties?q=${encodeURIComponent(property.pin)}`);
  }

  function goToUser(managedUser: ManagedUser) {
    setResultsOpen(false);
    setSearch("");
    router.push(`/users?q=${encodeURIComponent(managedUser.fullName)}`);
  }

  const hasResults = !!results && (results.properties.length > 0 || results.users.length > 0);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-surface px-6 py-3.5">
      <div ref={containerRef} className="relative max-w-xl flex-1">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setResultsOpen(true);
          }}
          onFocus={() => setResultsOpen(true)}
          placeholder="Search properties by PIN/address, or users by name…"
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
        />

        {resultsOpen && search.trim().length >= 2 && (
          <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
            {searching && <p className="px-4 py-3 text-sm text-muted">Searching…</p>}
            {!searching && !hasResults && <p className="px-4 py-3 text-sm text-muted">No matches.</p>}
            {!searching && results && results.properties.length > 0 && (
              <div className="py-1">
                <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Properties</p>
                {results.properties.map((property) => (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => goToProperty(property)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition hover:bg-foreground/[0.04]"
                  >
                    <Building2 size={14} className="shrink-0 text-muted" />
                    <span className="truncate">
                      <span className="font-semibold text-foreground">{property.pin}</span>
                      <span className="text-muted"> — {property.address}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {!searching && results && results.users.length > 0 && (
              <div className="border-t border-border py-1">
                <p className="px-4 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">Users</p>
                {results.users.map((managedUser) => (
                  <button
                    key={managedUser.id}
                    type="button"
                    onClick={() => goToUser(managedUser)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition hover:bg-foreground/[0.04]"
                  >
                    <UserIcon size={14} className="shrink-0 text-muted" />
                    <span className="truncate">
                      <span className="font-semibold text-foreground">{managedUser.fullName}</span>
                      <span className="text-muted"> — {managedUser.phoneNumber}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={notifRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setNotifOpen((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-lg">
            <p className="text-sm font-semibold text-foreground">No live alerts yet</p>
            <p className="mt-1 text-xs text-muted">
              There&apos;s no real-time notification feed on the backend yet — this won&apos;t surface anything
              until one exists.
            </p>
          </div>
        )}
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-border py-1.5 pl-1.5 pr-3 transition hover:bg-foreground/[0.03]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-secondary text-xs font-semibold text-white">
            {initials(user.fullName, user.email)}
          </span>
          <span className="text-sm font-medium capitalize text-foreground">{user.role.toLowerCase()}</span>
          <ChevronDown size={14} className={`text-muted transition ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-semibold text-foreground">{user.fullName ?? user.email}</p>
                <p className="truncate text-xs text-muted">{user.phoneNumber}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-muted transition hover:bg-foreground/[0.04] hover:text-foreground"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
