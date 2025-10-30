"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // only run client-side
    try {
      const token = localStorage.getItem("zestpos_token");
      if (!token) {
        // if already on /login or /forgot-password, do not redirect
        if (pathname && !pathname.startsWith("/login") && !pathname.startsWith("/forgot-password")) {
          router.replace(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
          return; // Just return here, no JSX
        }
      }
    } catch (e) {
      // ignore localStorage errors
    } finally {
      setChecked(true);
    }
  }, [router, pathname]);

  // Wait until we've checked localStorage to avoid flicker
  if (!checked) return <>{children}</>;
  return <>{children}</>;
}
