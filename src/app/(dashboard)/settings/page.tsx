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

type SettingsFormValues = z.infer<ReturnType<typeof createSettingsSchema>>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [mobileNumber, setMobileNumber] = useState("");
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);
  const settingsSchema = useMemo(() => createSettingsSchema(), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
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
        <h1 className="text-xl font-bold text-gray-900">{copy.settings.title}</h1>
        <p className="text-sm text-gray-500">{copy.settings.subtitle}</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">
            {copy.settings.businessInfo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{copy.common.mobileNumber}</Label>
              <Input value={mobileNumber} disabled className="bg-gray-50" />
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
                <p className="text-xs text-red-600">
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
    </div>
  );
}
