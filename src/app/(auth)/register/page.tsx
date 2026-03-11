"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { isValidPhilippineMobile } from "@/lib/mobileNumber";

const registerSchema = z.object({
  mobileNumber: z
    .string()
    .min(1, "Mobile number is required")
    .refine(isValidPhilippineMobile, "Enter a valid Philippine mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json();
      setServerError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    const signInResult = await signIn("credentials", {
      mobileNumber: values.mobileNumber,
      password: values.password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Create account</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Start tracking your profits today</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  autoComplete="tel"
                  {...register("mobileNumber")}
                />
                {errors.mobileNumber && (
                  <p className="text-xs text-red-600">{errors.mobileNumber.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessName">
                  Business Name{" "}
                  <span className="font-normal text-gray-400 dark:text-zinc-500">(optional)</span>
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="My Store"
                  autoComplete="organization"
                  {...register("businessName")}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-green-700 hover:underline dark:text-green-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
