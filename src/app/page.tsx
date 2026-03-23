"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrendingUp, BarChart2, Receipt, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  readSavedAppLanguage,
  writeSavedAppLanguage,
  type AppLanguage,
} from "@/lib/languagePreference";

const copy = {
    en: {
    languageLabel: "Tagalog",
    signIn: "Sign in",
    getStarted: "Get Started",
    heroTagline: "Track your daily sales in seconds.",
    heroBody:
      "Track your daily sales and expenses in seconds and instantly see how much your business really earned today. No spreadsheets. No guessing. Just your profit, right now.",
    heroCta: "CREATE YOUR FREE ACCOUNT AND START TRACKING TODAY.",
    features: [
      {
        title: "Log Sales",
        body: "Record each sale in one tap. Add a note if you want. Done in seconds.",
      },
      {
        title: "Log Expenses",
        body: "Track where your money goes - ingredients, packaging, gas, rent, and more.",
      },
      {
        title: "See Profit",
        body: "Your profit is calculated automatically and displayed in big, bold numbers.",
      },
    ],
    footer: "Built for small business owners.",
  },
    tl: {
    languageLabel: "English",
    signIn: "Mag-sign in",
    getStarted: "Magsimula",
    heroTagline: "I-track ang araw-araw mong benta sa loob ng ilang segundo.",
    heroBody:
      "I-track ang araw-araw mong benta at gastos sa loob ng ilang segundo at makita agad kung magkano talaga ang kinita ng negosyo mo ngayong araw. Walang spreadsheet. Walang hula. Kita mo agad ang tunay mong tubo.",
    heroCta: "GUMAWA NG LIBRENG ACCOUNT AT MAGSIMULANG MAG-TRACK NGAYON.",
    features: [
      {
        title: "Itala ang Benta",
        body: "Itala ang bawat benta sa isang pindot. Magdagdag ng note kung gusto mo. Tapos agad sa ilang segundo.",
      },
      {
        title: "Itala ang Gastos",
        body: "I-track kung saan napupunta ang pera mo - sangkap, packaging, gas, renta, at iba pa.",
      },
      {
        title: "Tingnan ang Tubo",
        body: "Awtomatikong kino-compute ang tubo mo at ipinapakita ito sa malaki at malinaw na numero.",
      },
    ],
    footer: "Ginawa para sa maliliit na negosyante.",
  },
} as const;

export default function LandingPage() {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const content = copy[language];

  useEffect(() => {
    const savedLanguage = readSavedAppLanguage();
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    writeSavedAppLanguage(language);
  }, [language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <nav className="flex items-center justify-between px-6 sm:px-8 lg:px-12 py-4 w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">SalesSnap</span>
          <ThemeToggle compact />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            {content.signIn}
          </Link>
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "tl" : "en")}
            className="rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:border-green-300 hover:bg-green-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-green-400 dark:hover:bg-zinc-700"
          >
            {content.languageLabel}
          </button>
        </div>
      </nav>

      <section className="px-6 sm:px-8 lg:px-12 py-16 sm:py-24 text-center w-full">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 shadow-xl shadow-green-200 dark:shadow-green-900/40">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-green-900 tracking-tight mb-4 dark:text-green-300">
          SalesSnap
        </h1>
        <p className="text-xl sm:text-2xl text-gray-500 italic mb-6 dark:text-zinc-400">
          {content.heroTagline}
        </p>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed dark:text-zinc-300">
          {content.heroBody}
        </p>

        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-green-300 transition-all w-full sm:w-auto justify-center dark:shadow-green-900/40 dark:hover:shadow-green-900/60"
        >
          <Zap className="h-5 w-5" />
          {content.heroCta}
        </Link>
      </section>

      <section className="px-6 sm:px-8 lg:px-12 pb-20 w-full">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm dark:border-green-900/50 dark:bg-zinc-900">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40">
              <TrendingUp className="h-5 w-5 text-green-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2 dark:text-zinc-100">
              {content.features[0].title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed dark:text-zinc-400">
              {content.features[0].body}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm dark:border-red-900/50 dark:bg-zinc-900">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
              <Receipt className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2 dark:text-zinc-100">
              {content.features[1].title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed dark:text-zinc-400">
              {content.features[1].body}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm dark:border-blue-900/50 dark:bg-zinc-900">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
              <BarChart2 className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2 dark:text-zinc-100">
              {content.features[2].title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed dark:text-zinc-400">
              {content.features[2].body}
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400 dark:border-zinc-800 dark:text-zinc-500">
        © {new Date().getFullYear()} SalesSnap. {content.footer}
      </footer>
    </div>
  );
}