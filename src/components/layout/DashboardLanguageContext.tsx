"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readSavedAppLanguage,
  writeSavedAppLanguage,
  type AppLanguage,
} from "@/lib/languagePreference";

export type DashboardLanguage = AppLanguage;

interface DashboardLanguageContextValue {
  language: DashboardLanguage;
  setLanguage: (language: DashboardLanguage) => void;
}

const DashboardLanguageContext = createContext<DashboardLanguageContextValue | null>(null);

export function DashboardLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<DashboardLanguage>("en");

  useEffect(() => {
    const savedLanguage = readSavedAppLanguage();
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    writeSavedAppLanguage(language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language]
  );

  return (
    <DashboardLanguageContext.Provider value={value}>
      {children}
    </DashboardLanguageContext.Provider>
  );
}

export function useDashboardLanguage() {
  const context = useContext(DashboardLanguageContext);
  if (!context) {
    throw new Error("useDashboardLanguage must be used within DashboardLanguageProvider");
  }

  return context;
}

interface DashboardLanguageToggleProps {
  compact?: boolean;
}

export function DashboardLanguageToggle({ compact = false }: DashboardLanguageToggleProps) {
  const { language, setLanguage } = useDashboardLanguage();

  return (
    <div
      className={
        compact
          ? "inline-flex w-14 flex-col gap-1 rounded-xl bg-white p-1 dark:bg-zinc-900"
          : "inline-flex items-center rounded-xl bg-white p-1 dark:bg-zinc-900"
      }
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`${compact ? "w-full px-1 py-1 text-[10px]" : "min-h-[36px] px-3 py-1.5 text-xs"} rounded-lg font-semibold leading-tight transition-colors ${
          language === "en"
            ? "bg-green-100 text-green-800 shadow-sm dark:bg-green-950/50 dark:text-green-200"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }`}
        aria-pressed={language === "en"}
        aria-label="Switch language to English"
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage("tl")}
        className={`${compact ? "w-full px-1 py-1 text-[10px]" : "min-h-[36px] px-3 py-1.5 text-xs"} rounded-lg font-semibold leading-tight transition-colors ${
          language === "tl"
            ? "bg-green-100 text-green-800 shadow-sm dark:bg-green-950/50 dark:text-green-200"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }`}
        aria-pressed={language === "tl"}
        aria-label="Switch language to Tagalog"
      >
        Tagalog
      </button>
    </div>
  );
}