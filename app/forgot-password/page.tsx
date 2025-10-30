// app/forgot-password/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Mock function to "send" password reset link.
 * Replace with real API call when ready.
 */
async function mockSendResetEmail(email: string) {
  // simulate network delay
  await new Promise((res) => setTimeout(res, 700));

  // simple mock rules:
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please provide a valid email address.");
  }

  // pretend the email exists and an email was sent
  return { ok: true, message: "Reset link sent if the account exists." };
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    let timer: number | undefined;
    if (cooldown > 0) {
      timer = window.setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [cooldown]);

  const validate = () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await mockSendResetEmail(email.trim());
      if (res.ok) {
        setSuccess(
          "If an account with that email exists, a password reset link has been sent. Please check your inbox."
        );
        setCooldown(10); // 10s cooldown before allowing resend
        setEmail(""); // clear input (optional)
      } else {
        setError(res.message || "Failed to send reset link. Try again later.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset link. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src="/tali-logo.svg" alt="ZestPOS" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-600 mt-1">
            Enter your email and we will send a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/0 p-6 rounded-md" aria-live="polite">
          <div className="mb-4">
            <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <Input
              id="fp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              aria-required
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 text-sm text-green-700" role="status">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className={`w-full py-2 ${
                loading || cooldown > 0 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
              disabled={loading || cooldown > 0}
              aria-disabled={loading || cooldown > 0}
              title={cooldown > 0 ? `Please wait ${cooldown}s before retrying` : "Send reset link"}
            >
              {loading ? "Sending..." : cooldown > 0 ? `Retry in ${cooldown}s` : "Send reset link"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Back to{" "}
              <Link href="/login" className="text-indigo-600 hover:underline">
                sign in
              </Link>
            </div>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} t.alimahomed (ZestPOS)
        </div>
      </div>
    </main>
  );
}
