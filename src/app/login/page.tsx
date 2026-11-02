"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const { login, status, user } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace("/overview");
    }
  }, [status, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await login(phoneNumber, password);
    setSubmitting(false);
    const latestError = useAuthStore.getState().error;
    if (latestError) {
      toast.critical(latestError);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-surface lg:flex-row">
      <ThemeToggle className="absolute right-4 top-4 z-20" />
      {/* Side image panel — full height on wide screens (image sits beside
          the form, not above it); collapses to a short top banner on
          narrow screens where a side-by-side layout wouldn't fit. */}
      <div className="relative h-28 w-full shrink-0 overflow-hidden lg:h-auto lg:w-[42%]">
        <Image
          src="/images/login_bg.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40 lg:bg-gradient-to-t lg:from-black/70 lg:via-black/20 lg:to-black/50" />
        <div className="absolute inset-x-0 bottom-4 flex justify-center lg:bottom-10">
          <div className="flex h-12 w-32 items-center justify-center rounded-lg bg-white shadow-lg lg:h-16 lg:w-40 lg:rounded-xl">
            <Image
              src="/images/luc_logo.png"
              alt="LASG PTS"
              width={120}
              height={40}
              className="h-8 w-auto object-contain lg:h-10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-16">
        <div className="w-full max-w-lg rounded-2xl bg-surface p-10 shadow-xl lg:max-w-xl lg:p-0 lg:shadow-none">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-secondary">LASG PTS 2.0</p>
          <h1 className="font-heading mt-2 text-3xl font-bold text-foreground lg:text-4xl">Portal Sign In</h1>
          <p className="mt-2 text-base text-muted">Supervisors, admins, and auditors only.</p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number</label>
              <input
                className="w-full rounded-xl border border-border px-4 py-3.5 text-base outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08030000000"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                className="w-full rounded-xl border border-border px-4 py-3.5 text-base outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-3 rounded-xl bg-brand-secondary px-4 py-3.5 text-base font-semibold text-white transition disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
