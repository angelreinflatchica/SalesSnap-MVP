"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";

function createSettingsSchema() {
  return z.object({
    businessName: z.string().max(100).optional(),
    displayName: z.string().max(60).optional(),
    tagline: z.string().max(120).optional(),
    avatarColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Invalid color").optional(),
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
  const [accountClaimed, setAccountClaimed] = useState(false);
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);
  const defaultAvatarColor = "#16a34a";
  const avatarPalette = ["#16a34a", "#2563eb", "#0ea5e9", "#f97316", "#d946ef", "#0f172a"];
  const settingsSchema = useMemo(() => createSettingsSchema(), []);
  const passwordSchema = useMemo(() => createPasswordSchema(), []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      avatarColor: defaultAvatarColor,
    },
  });
  const watchDisplayName = watch("displayName") ?? "";
  const watchTagline = watch("tagline") ?? "";
  const watchAvatarColor = watch("avatarColor") ?? defaultAvatarColor;
  const previewName = watchDisplayName.trim() || copy.settings.businessPlaceholder;
  const previewTagline = watchTagline.trim() || copy.settings.profileHeroSubtitle;
  const profileInitials = previewName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "SS";

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) {
          const errorMessage = await res.text().catch(() => "Failed to load settings");
          toast.error(errorMessage || "Failed to load settings. Please try again later.");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.user) {
          setMobileNumber(data.user.mobileNumber ?? "");
          setAccountClaimed(Boolean(data.user.accountClaimed));
          reset({
            businessName: data.user.businessName ?? "",
            displayName: data.user.displayName ?? "",
            tagline: data.user.tagline ?? "",
            avatarColor: data.user.avatarColor ?? defaultAvatarColor,
          });
        }
      } catch (error) {
        console.error("Settings load failed", error);
        toast.error("Failed to load settings. Please try again.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [reset, defaultAvatarColor]);

  async function onSubmit(values: SettingsFormValues) {
    const normalizedAvatar = values.avatarColor || defaultAvatarColor;
    const nextClaimStatus = accountClaimed || Boolean(values.displayName?.trim() || values.tagline?.trim());
    const payload = {
      ...values,
      avatarColor: normalizedAvatar,
      accountClaimed: nextClaimStatus,
    };

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast.success(copy.settings.saved);
      setAccountClaimed(nextClaimStatus);
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

  function handleClaimProfile() {
    if (accountClaimed) return;
    setAccountClaimed(true);
    toast.success(copy.settings.claimStatusClaimed);
  }

  return (
    <div className="w-full py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{copy.settings.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.settings.subtitle}</p>
      </div>

      <div className="rounded-3xl border border-green-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-slate-950/30 dark:to-emerald-900/30">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-xl"
              style={{ backgroundColor: watchAvatarColor }}
            >
              {profileInitials}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">
                {copy.settings.profileHeroTitle}
              </p>
              <h2 className="text-2xl font-bold text-foreground">{previewName}</h2>
              <p className="text-sm text-muted-foreground">{previewTagline}</p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ${
                accountClaimed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
              }`}
            >
              {accountClaimed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {accountClaimed ? copy.settings.claimStatusClaimed : copy.settings.claimStatusUnclaimed}
            </span>
            {!accountClaimed && (
              <button
                type="button"
                onClick={handleClaimProfile}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {copy.settings.claimCta}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              {copy.settings.profileHeroTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{copy.settings.profileHeroSubtitle}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">{copy.settings.displayName}</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="e.g. Ate Mylene"
                    {...register("displayName")}
                  />
                  {errors.displayName && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.displayName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tagline">{copy.settings.tagline}</Label>
                  <Input
                    id="tagline"
                    type="text"
                    placeholder="e.g. Best merienda in the barangay"
                    {...register("tagline")}
                  />
                  {errors.tagline && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.tagline.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{copy.settings.avatarColor}</Label>
                <input type="hidden" value={watchAvatarColor} readOnly {...register("avatarColor")} />
                <div className="flex flex-wrap gap-3">
                  {avatarPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue("avatarColor", color, { shouldDirty: true })}
                      className={`h-10 w-10 rounded-full border-2 transition shadow-sm ${
                        watchAvatarColor === color
                          ? "border-foreground ring-2 ring-emerald-300"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-pressed={watchAvatarColor === color}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {accountClaimed ? copy.settings.claimStatusClaimed : copy.settings.claimStatusUnclaimed}
                </p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80">
                  {copy.settings.claimHelper}
                </p>
                {!accountClaimed && (
                  <button
                    type="button"
                    onClick={handleClaimProfile}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.settings.claimCta}
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    copy.common.saveChanges
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {copy.settings.securityHeading}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{copy.settings.securitySubtitle}</p>
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
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors dark:bg-slate-800 dark:hover:bg-slate-700"
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
    </div>
  );
}
