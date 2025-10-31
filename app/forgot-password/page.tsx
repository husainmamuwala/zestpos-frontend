"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

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
      const res = await fetch(`${API}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // no credentials needed for this endpoint
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Request failed");

      setSuccess(
        "A reset link has been sent. Check your inbox."
      );
      setEmail("");
      // optional: redirect to login after a delay
      // setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      console.error("request-password-reset error:", err);
      setError((err as Error).message || "Failed to request reset. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Enter your email to get a password reset link.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/0 p-6 rounded-md"
          aria-live="polite"
        >
          <div className="mb-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>

          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          {success && (
            <div className="mb-3 text-sm text-green-700">{success}</div>
          )}

          <div className="flex flex-col gap-3 mt-10">
            <Button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Back to sign in
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
