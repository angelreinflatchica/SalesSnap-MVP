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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
          <User className="h-4 w-4 text-green-700" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900 leading-none dark:text-zinc-100">
            {businessName ?? mobileNumber ?? copy.common.myBusiness}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label={copy.common.signOut}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
