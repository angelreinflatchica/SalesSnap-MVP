"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrendingUp, BarChart2, Receipt, Zap } from "lucide-react";
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
    heroCta: "Create your free account and start tracking today.",
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
    heroCta: "Gumawa ng libreng account at magsimulang mag-track ngayon.",
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <nav className="flex items-center justify-between px-6 sm:px-8 lg:px-12 py-4 w-full">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">SalesSnap</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "tl" : "en")}
            className="rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:border-green-300 hover:bg-green-50"
          >
            {content.languageLabel}
          </button>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {content.signIn}
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
          >
            {content.getStarted}
          </Link>
        </div>
      </nav>

      <section className="px-6 sm:px-8 lg:px-12 py-16 sm:py-24 text-center w-full">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 shadow-xl shadow-green-200">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-green-900 tracking-tight mb-4">
          SalesSnap
        </h1>
        <p className="text-xl sm:text-2xl text-gray-500 italic mb-6">
          {content.heroTagline}
        </p>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          {content.heroBody}
        </p>

        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-green-300 transition-all w-full sm:w-auto justify-center"
        >
          <Zap className="h-5 w-5" />
          {content.heroCta}
        </Link>
      </section>

      <section className="px-6 sm:px-8 lg:px-12 pb-20 w-full">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {content.features[0].title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {content.features[0].body}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <Receipt className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {content.features[1].title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {content.features[1].body}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <BarChart2 className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {content.features[2].title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {content.features[2].body}
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} SalesSnap. {content.footer}
      </footer>
    </div>
  );
}
