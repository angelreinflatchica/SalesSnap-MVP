"use client";

import { signOut } from "next-auth/react";
import { TrendingUp, LogOut, User } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DashboardLanguageToggle } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";

interface NavbarProps {
  businessName?: string | null;
  mobileNumber?: string | null;
}

export function Navbar({ businessName, mobileNumber }: NavbarProps) {
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600">
          <TrendingUp className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-base font-bold text-gray-900 dark:text-zinc-100">SalesSnap</span>
      </Link>

      <div className="flex items-center gap-3">
        <DashboardLanguageToggle compact />
        <ThemeToggle compact />

        <details className="relative">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-green-100 text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60">
            <User className="h-4 w-4" />
            <span className="sr-only">Account menu</span>
          </summary>

          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="rounded-lg px-2 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                Account
              </p>
              <p className="mt-1 truncate text-sm font-medium text-gray-900 dark:text-zinc-100">
                {businessName ?? mobileNumber ?? copy.common.myBusiness}
              </p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-1 inline-flex min-h-[40px] w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label={copy.common.signOut}
            >
              <LogOut className="h-4 w-4" />
              {copy.common.signOut}
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
