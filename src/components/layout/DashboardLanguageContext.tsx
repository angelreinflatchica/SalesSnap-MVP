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
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          language === "en"
            ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
            : "text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
        aria-pressed={language === "en"}
      >
        {compact ? "EN" : "English"}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("tl")}
        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          language === "tl"
            ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
            : "text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
        aria-pressed={language === "tl"}
      >
        {compact ? "TL" : "Tagalog"}
      </button>
    </div>
  );
}