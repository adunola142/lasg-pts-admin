"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Root route is just a redirect to the actual portal home — keeps every
// real page under (portal) or /login, with no ambiguity about what "/"
// renders.
export default function RootRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/overview");
  }, [router]);
  return null;
}
