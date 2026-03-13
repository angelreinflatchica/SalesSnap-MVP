"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { isValidPhilippineMobile } from "@/lib/mobileNumber";

type RequestResponse = {
  message?: string;
  error?: string;
  devOtp?: string;
  retryAfterSeconds?: number;
  devDebug?: {
    smsDelivery: "sent" | "not_delivered";
    reason?: string;
  };
};

type ResetResponse = {
  message?: string;
  error?: string;
  retryAfterSeconds?: number;
};

function safeParseApiJson<T>(raw: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function ForgotPasswordPage() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [requestError, setRequestError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [devDiagnostic, setDevDiagnostic] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function handleRequestOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRequestError(null);
    setResetError(null);
    setSuccessMessage(null);
    setDevOtp(null);
    setDevDiagnostic(null);

    if (!isValidPhilippineMobile(mobileNumber)) {
      setRequestError("Enter a valid Philippine mobile number");
      return;
    }

    if (resendCooldown > 0) {
      setRequestError(`Please wait ${resendCooldown}s before requesting another OTP`);
      return;
    }

    try {
      setIsRequestingOtp(true);
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });

      const raw = await res.text();
      const data = safeParseApiJson<RequestResponse>(raw);

      if (!res.ok) {
        if (res.status === 429 && data?.retryAfterSeconds) {
          setResendCooldown(data.retryAfterSeconds);
        }

        if (res.status === 503 && data?.error === "OFFLINE") {
          setRequestError("No internet connection detected. Please reconnect and try again.");
          return;
        }

        const fallbackError =
          raw && !data
            ? `Unable to request OTP right now (HTTP ${res.status})`
            : "Unable to request OTP right now";

        setRequestError(data?.error ?? fallbackError);
        return;
      }

      setOtpRequested(true);
      setSuccessMessage(data?.message ?? "OTP sent");
      setDevOtp(data?.devOtp ?? null);
      setResendCooldown(data?.retryAfterSeconds ?? 30);

      if (data?.devDebug?.smsDelivery === "not_delivered") {
        if (data.devDebug.reason === "sms_not_configured") {
          setDevDiagnostic("SMS provider is not configured. Add SEMAPHORE_API_KEY in .env.local and restart the server.");
        } else {
          setDevDiagnostic(`SMS delivery failed (${data.devDebug.reason ?? "unknown reason"}).`);
        }
      }
    } catch {
      setRequestError("Unable to request OTP right now. Please check your connection and try again.");
    } finally {
      setIsRequestingOtp(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError(null);
    setSuccessMessage(null);

    if (!isValidPhilippineMobile(mobileNumber)) {
      setResetError("Enter a valid Philippine mobile number");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setResetError("Enter the 6-digit OTP");
      return;
    }

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    try {
      setIsResettingPassword(true);
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, otp, newPassword }),
      });

      const raw = await res.text();
      const data = safeParseApiJson<ResetResponse>(raw);

      if (!res.ok) {
        if (res.status === 503 && data?.error === "OFFLINE") {
          setResetError("No internet connection detected. Please reconnect and try again.");
          return;
        }

        const fallbackError =
          raw && !data
            ? `Unable to reset password right now (HTTP ${res.status})`
            : "Unable to reset password right now";

        setResetError(data?.error ?? fallbackError);
        return;
      }

      setSuccessMessage("Password reset successful. You can now sign in.");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpRequested(false);
      setDevOtp(null);
    } catch {
      setResetError("Unable to reset password right now");
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 px-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Forgot your password?</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Reset your password using an OTP sent to your mobile number.</p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <form onSubmit={handleRequestOtp} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="09XXXXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  disabled={isRequestingOtp || isResettingPassword}
                />
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp || isResettingPassword || resendCooldown > 0}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-green-500 dark:text-green-400 dark:hover:bg-zinc-900"
              >
                {isRequestingOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : resendCooldown > 0 ? (
                  `Resend OTP in ${resendCooldown}s`
                ) : (
                  otpRequested ? "Resend OTP" : "Send OTP"
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-zinc-400">
                You can request a new OTP every 30 seconds. Too many failed reset attempts will temporarily lock password reset for your account.
              </p>
            </form>

            {requestError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{requestError}</p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {devOtp && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-700">Development OTP: {devOtp}</p>
              </div>
            )}

            {devDiagnostic && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-700">{devDiagnostic}</p>
              </div>
            )}

            {otpRequested && (
              <form onSubmit={handleResetPassword} className="space-y-3 border-t border-gray-100 pt-4 dark:border-zinc-800">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={isResettingPassword}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isResettingPassword}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isResettingPassword}
                  />
                </div>

                {resetError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResettingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}

            <Link
              href="/login"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Back to Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
