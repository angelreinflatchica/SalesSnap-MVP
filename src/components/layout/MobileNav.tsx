"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Settings, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";

const navItems = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/history", key: "history", icon: History },
  { href: "/summary", key: "summary", icon: BarChart2 },
  { href: "/settings", key: "settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-100 bg-white px-4 py-2 lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
      {navItems.map(({ href, key, icon: Icon }) => {
        const active = pathname === href;
        const label = copy.nav[key as keyof typeof copy.nav];
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "text-green-600 dark:text-green-300")} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
