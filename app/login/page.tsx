"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { publicApi } from "@/lib/api";
import toast from "react-hot-toast";
import Loader from "@/utils/loader";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return false;
    }

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
      const result = await publicApi.post("/auth/login", {
        email: email.trim(),
        password,
      }).then(res => res.data);
      try {
        localStorage.setItem("zestpos_token", result.token);
      } catch (err) {
        console.warn("localStorage write failed", err);
      }
      router.push("/");
      toast.success("Logged in successfully.");
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Login failed. Try again.");
      setLoading(false);
    }
    finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (<Loader />)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <img src="/zestposlogo.png" alt="ZestPOS" className="h-14 mx-auto" />
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
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
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
          <div className="flex justify-end mb-4">
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
              className={`w-full cursor-pointer flex justify-center items-center py-2 ${loading ? "opacity-80 cursor-wait" : "hover:bg-purple-700"
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