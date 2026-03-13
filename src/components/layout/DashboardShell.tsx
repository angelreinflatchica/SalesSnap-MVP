"use client";

import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  DashboardLanguageProvider,
  useDashboardLanguage,
} from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";

interface DashboardShellProps {
  children: React.ReactNode;
  businessName?: string | null;
  mobileNumber?: string | null;
}

export function DashboardShell({ children, businessName, mobileNumber }: DashboardShellProps) {
  return (
    <DashboardLanguageProvider>
      <DashboardShellContent businessName={businessName} mobileNumber={mobileNumber}>
        {children}
      </DashboardShellContent>
    </DashboardLanguageProvider>
  );
}

function DashboardShellContent({ children, businessName, mobileNumber }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar businessName={businessName} mobileNumber={mobileNumber} />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed left-4 top-4 z-40 hidden h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 lg:inline-flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          aria-label={copy.common.openSidebar}
          title={copy.common.openSidebar}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <MobileNav />
    </div>
  );
}
