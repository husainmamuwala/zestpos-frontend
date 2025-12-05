/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import Loader from "@/utils/loader";

export default function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState<boolean>(true);
  const validateToken = async (token: string | null, setLoading: any) => {
    try {
      const res = await authApi.get("/invoice/all");
      console.log("response", res);

      if (res.data.status !== "success" || !token) {
        localStorage.removeItem("zestpos_token");
        router.replace(`/login`);
      }
    }
    catch (err) {
      console.log("error", err);
      localStorage.removeItem("zestpos_token");
      router.replace(`/login`);
      toast.error("Session expired. Please log in again.");
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const token = localStorage.getItem("zestpos_token");
      validateToken(token, setLoading);
    } catch (err) {
      console.log("error", err);
      router.replace(`/login`);
    }
  }, [router, pathname]);

  if (loading) return <Loader />;
  return <>{children}</>;
}
