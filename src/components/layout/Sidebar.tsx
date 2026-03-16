"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  History,
  Settings,
  TrendingUp,
  BarChart2,
  PanelLeftClose,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  DashboardLanguageToggle,
  useDashboardLanguage,
} from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";

const navItems = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/history", key: "history", icon: History },
  { href: "/summary", key: "summary", icon: BarChart2 },
  { href: "/settings", key: "settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r px-3 py-6 transition-[width] duration-200 lg:flex",
        "border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-20" : "w-60"
      )}
    >
      <div className="mb-8 flex items-center justify-between px-1">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">SalesSnap</span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = pathname === href;
          const label = copy.nav[key as keyof typeof copy.nav];
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex min-h-[44px] items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "gap-3",
                active
                  ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", active && "text-green-600 dark:text-green-300")} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-2">
        <div className={cn("space-y-2", collapsed && "flex flex-col items-center")}>
          <DashboardLanguageToggle compact={collapsed} />
          <ThemeToggle compact={collapsed} />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? copy.common.signOut : undefined}
          className={cn(
            "inline-flex min-h-[44px] w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            collapsed ? "justify-center" : "gap-3",
            "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          )}
          aria-label={copy.common.signOut}
        >
          <LogOut className="h-4.5 w-4.5" />
          {!collapsed && copy.common.signOut}
        </button>
      </div>
    </aside>
  );
}
