"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  AlertOctagon,
  Truck,
  Home,
  LogOut,
  Building2,
  ChevronDown,
  Users as UsersNavIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { initials } from "@/lib/avatar";

function titleCase(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

const NAV = [
  { href: "/overview", label: "Overview", Icon: LayoutDashboard },
  { href: "/enumerations", label: "Enumerations", Icon: ClipboardList },
  { href: "/gaps", label: "Compliance Gaps", Icon: AlertOctagon },
  { href: "/deliveries", label: "Deliveries", Icon: Truck },
  { href: "/properties", label: "Properties", Icon: Home },
  { href: "/users", label: "Users", Icon: UsersNavIcon },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, restore, logout } = useAuthStore();
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "idle" || status === "restoring") {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading…</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* The sidebar follows the page theme — white in light mode,
          black in dark mode (see --sidebar in globals.css) — so every
          text/border utility below reads the normal
          --foreground/--muted/--border tokens, same as the rest of
          the app, rather than hardcoded white-based shades. */}
      <aside className="flex w-72 flex-col border-r border-border bg-sidebar px-4 py-6 text-foreground">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-secondary/15 text-brand-secondary">
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-heading truncate text-sm font-bold leading-tight">LASG PTS 2.0</p>
            <p className="truncate text-xs text-muted">Reporting Portal</p>
          </div>
        </div>

        <p className="mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Main</p>
        <nav className="mt-2 flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-secondary" />
                )}
                <Icon size={18} className={active ? "text-brand-secondary" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-border pt-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-xl bg-foreground/[0.04] px-3 py-2.5 transition hover:bg-foreground/[0.08]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-xs font-semibold text-white">
                {initials(user.fullName, user.email)}
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground">
                {titleCase(user.role)}
              </span>
              <ChevronDown size={14} className={`text-muted transition ${accountOpen ? "rotate-180" : ""}`} />
            </button>

            {accountOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                <div className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-semibold text-foreground">{user.fullName ?? user.email}</p>
                    <p className="truncate text-xs text-muted">{user.phoneNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-muted transition hover:bg-foreground/[0.04] hover:text-foreground"
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>

          <ThemeToggle variant="segmented" />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <TopBar user={user} onLogout={logout} />
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden bg-background p-8">
          {/* Soft ambient color blobs — light mode only. Dark mode
              stays the plain near-black background; these are purely
              decorative, pinned to the content area's corners and
              clipped by `main`'s own overflow-hidden rather than the
              viewport, so they scroll out of view with long pages
              instead of hovering over content. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden" aria-hidden="true">
            <div className="absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-[#9085e9] opacity-20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-[420px] w-[420px] rounded-full bg-[#1baf7a] opacity-15 blur-3xl" />
          </div>
          <div className="relative flex min-h-full w-full flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
