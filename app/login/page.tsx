"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

/**
 * Mock auth function (replace with your API call)
 * resolves with a fake token if email/password are non-empty and password length >= 4
 */
async function mockAuth(email: string, password: string) {
  // simulate a short network call
  await new Promise((res) => setTimeout(res, 400));
  if (!email || !password) throw new Error("Invalid credentials");
  if (password.length < 4) throw new Error("Password must be at least 4 characters");
  // return fake token & user
  return {
    token: "zestpos_mock_token_123456",
    user: { email, name: "ZestPOS User" },
  };
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // load remembered email if present
  useEffect(() => {
    try {
      const remembered = localStorage.getItem("zestpos_remembered_email");
      if (remembered) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(remembered);
        setRemember(true);
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  const validate = () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return false;
    }
    // simple email basic check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Please enter your password.");
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

    try {
      const result = await mockAuth(email.trim(), password);
      // persist token (mock) and user
      try {
        localStorage.setItem("zestpos_token", result.token);
        localStorage.setItem("zestpos_user", JSON.stringify(result.user));
        if (remember) {
          localStorage.setItem("zestpos_remembered_email", email.trim());
        } else {
          localStorage.removeItem("zestpos_remembered_email");
        }
      } catch (err) {
        // ignore localStorage write errors but still proceed
        console.warn("localStorage write failed", err);
      }

      // redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Login failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <img src="/tali-logo.svg" alt="ZestPOS" className="h-14 mx-auto" />
          <h1 className="text-2xl font-semibold text-gray-900 text-center mt-4">Sign in to ZestPOS</h1>
          <p className="text-sm text-gray-600 text-center mt-1">Enter your credentials to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/0 p-6 rounded-md"
          aria-describedby="login-error"
        >
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@gmail.com"
              autoComplete="email"
              aria-required
            />
          </div>

          {/* Password */}
          <div className="mb-2 relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-required
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-gray-700"
                tabIndex={0}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember & forgot */}
          <div className="flex items-center justify-between mb-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Remember me</span>
            </label>

            <a
              href="/forgot-password"
              className="text-sm text-indigo-600 hover:underline"
            >
              Forgot?
            </a>
          </div>

          {error && (
            <div
              id="login-error"
              role="alert"
              aria-live="assertive"
              className="mb-4 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className={`w-full flex justify-center items-center py-2 ${
                loading ? "opacity-80 cursor-wait" : "hover:bg-purple-700"
              } bg-purple-600 text-white`}
              disabled={loading}
              aria-disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

          </div>
        </form>

        {/* footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Tamco Tech (ZestPOS)
        </div>
      </div>
    </main>
  );
}