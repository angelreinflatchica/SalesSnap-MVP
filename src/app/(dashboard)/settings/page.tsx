"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";

function createSettingsSchema() {
  return z.object({
    businessName: z.string().max(100).optional(),
  });
}

function createPasswordSchema() {
  return z
    .object({
      currentPassword: z.string().min(8, "Current password is required"),
      newPassword: z.string().min(8, "New password must be at least 8 characters"),
      confirmPassword: z.string().min(8, "Please confirm your new password"),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: "New password and confirmation do not match",
      path: ["confirmPassword"],
    });
}

type SettingsFormValues = z.infer<ReturnType<typeof createSettingsSchema>>;
type PasswordFormValues = z.infer<ReturnType<typeof createPasswordSchema>>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [mobileNumber, setMobileNumber] = useState("");
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);
  const settingsSchema = useMemo(() => createSettingsSchema(), []);
  const passwordSchema = useMemo(() => createPasswordSchema(), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setMobileNumber(data.user.mobileNumber ?? "");
          reset({ businessName: data.user.businessName ?? "" });
        }
        setLoading(false);
      });
  }, [reset]);

  async function onSubmit(values: SettingsFormValues) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      toast.success(copy.settings.saved);
    } else {
      toast.error(copy.settings.saveFailed);
    }
  }

  async function onPasswordSubmit(values: PasswordFormValues) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      toast.success("Password updated successfully");
      resetPassword();
      return;
    }

    const data = await res.json().catch(() => ({}));
    toast.error(data.error ?? "Failed to update password");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">{copy.settings.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.settings.subtitle}</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            {copy.settings.businessInfo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{copy.common.mobileNumber}</Label>
              <Input value={mobileNumber} disabled className="bg-muted text-muted-foreground" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="businessName">{copy.settings.businessName}</Label>
              <Input
                id="businessName"
                type="text"
                placeholder={copy.settings.businessPlaceholder}
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                copy.common.saveChanges
              )}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...registerPassword("currentPassword")}
              />
              {passwordErrors.currentPassword && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...registerPassword("newPassword")}
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...registerPassword("confirmPassword")}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPasswordSubmitting}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPasswordSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
