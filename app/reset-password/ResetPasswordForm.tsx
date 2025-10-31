"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useState} from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

useEffect(()=>(
  console.log("Reset token:", token)
),[token])

  const validate = () => {
    if (!token || !token.trim()) {
      setError("Invalid reset token. Ensure you opened the link from your email.");
      return false;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccess("Password reset successfully. You can now log in.");
      setNewPassword("");
      setConfirmPassword("");

      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 sm:p-6">
  <div className="w-full max-w-md sm:max-w-lg">
    <div className="mb-6 text-center">
      <img src="/tali-logo.svg" alt="ZestPOS" className="h-12 mx-auto mb-3" />
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Reset Password</h1>
      <p className="text-sm sm:text-base text-gray-600 mt-1">Set a new password for your account.</p>
    </div>

    <div className="p-4">
      {/* messages */}
      <div aria-live="polite" className="mb-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-800 bg-green-50 border border-green-100 p-2 rounded">
            {success}
          </div>
        )}
      </div>

      {/* inputs */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          aria-label="New password"
        />
        <p className="text-xs text-gray-400 mt-1">At least 6 characters recommended.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          aria-label="Confirm new password"
        />
      </div>

      {/* actions: stacked on mobile, inline on md+ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          aria-disabled={loading}
          className={`w-full md:flex-1 flex justify-center items-center py-2 ${
            loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          {loading ? "Resetting..." : "Reset password"}
        </Button>

        <Button
          variant="outline"
          onClick={() => (window.location.href = "/login")}
          className="w-full md:w-36 px-4 py-2"
        >
          Back
        </Button>
      </div>
    </div>

    <div className="mt-6 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} Tamco Tech (ZestPOS)
    </div>
  </div>
</div>

  );
}