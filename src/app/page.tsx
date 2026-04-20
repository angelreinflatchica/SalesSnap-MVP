"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  BarChart2,
  Receipt,
  Zap,
  UserPlus,
  Wallet,
  History,
  ArrowRight,
} from "lucide-react";
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
    heroHighlights: [
      "Daily insights in under a minute",
      "Works on any phone and connection",
      "Built for sari-sari and micro businesses",
      "Your sales records stay private and protected.",
    ],
    metrics: [
      { value: "5K+", label: "Entries logged" },
      { value: "2 min", label: "Average setup time" },
      { value: "₱0", label: "Free forever" },
    ],
    featuresHeading: "Designed for your daily rhythm",
    featuresDescription:
      "Simple blocks that work together so you can log numbers without slowing the hustle.",
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
    guideHeading: "How to Get Started",
    guideDescription:
      "Follow these simple steps every day. Expenses are optional if you didn’t buy new stock.",
    guide: [
      {
        title: "Sign up / Log in",
        description: "Create your free account or log back in to keep everything in one place.",
        icon: "signup",
      },
      {
        title: "Add Sales",
        description: "Input the total sales you made today. One number only—nice and quick.",
        icon: "sales",
      },
      {
        title: "Add Expenses (optional)",
        description: "Record expenses only when you buy stock or supplies. Skip if none today.",
        icon: "expenses",
      },
      {
        title: "View Daily Profit",
        description: "Sales minus expenses are auto-computed so you instantly see today’s profit.",
        icon: "profit",
      },
      {
        title: "View History",
        description: "Check past entries anytime to spot trends and understand your progress.",
        icon: "history",
      },
    ],
    guideCta: "Start tracking right now",
    guideCtaSubtext: "You’ll be done in less than two minutes.",
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
    heroHighlights: [
      "Araw-araw na insight sa loob ng isang minuto",
      "Gumagana sa kahit anong phone at signal",
      "Ginawa para sa sari-sari at micro business",
      "Ang iyong mga tala ng benta ay mananatiling pribado at protektado.",
    ],
    metrics: [
      { value: "5K+", label: "Entries naitala" },
      { value: "2 min", label: "Karaniwang oras ng setup" },
      { value: "₱0", label: "Libre habambuhay" },
    ],
    featuresHeading: "Para sa galaw mo araw-araw",
    featuresDescription:
      "Magaan na mga tool na sabay-sabay gumagana kaya mabilis ka pa ring makakabenta.",
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
    guideHeading: "Paano Magsimula",
    guideDescription:
      "Sundan ang mga simpleng hakbang na ito. Opsyonal ang gastos kung wala kang biniling paninda ngayon.",
    guide: [
      {
        title: "Mag-sign up / Mag-login",
        description: "Gumawa ng libreng account o magbalik-login para manatili ang datos mo sa iisang lugar.",
        icon: "signup",
      },
      {
        title: "Ilagay ang Benta",
        description: "Ilagay lang ang kabuuang benta mo ngayong araw. Isang numero lang—mabilis tapusin.",
        icon: "sales",
      },
      {
        title: "Ilagay ang Gastos (opsyonal)",
        description: "I-record lang kapag may biniling paninda o gamit. Laktawan kung wala ngayong araw.",
        icon: "expenses",
      },
      {
        title: "Tingnan ang Arawang Tubo",
        description: "Awtomatikong kinukwenta ang tubo kaya kita mo agad kung magkano ang kinita mo.",
        icon: "profit",
      },
      {
        title: "Tingnan ang Kasaysayan",
        description: "Balikan ang mga nakaraang tala para makita ang galaw ng negosyo at makapaghanda.",
        icon: "history",
      },
    ],
    guideCta: "Simulan na ang pag-track",
    guideCtaSubtext: "Tapos ka na sa loob ng dalawang minuto.",
    footer: "Ginawa para sa maliliit na negosyante.",
  },
} as const;

const guideIconComponents = {
  signup: UserPlus,
  sales: Wallet,
  expenses: Receipt,
  profit: TrendingUp,
  history: History,
} as const;

type GuideIconKey = keyof typeof guideIconComponents;

export default function LandingPage() {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const content = copy[language];
  const previewData = [
    {
      title: content.features[0].title,
      body: content.features[0].body,
      amount: "₱8,540",
    },
    {
      title: content.features[1].title,
      body: content.features[1].body,
      amount: "₱2,310",
    },
  ];
  const featureIcons = [TrendingUp, Receipt, BarChart2];

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
    <div className="relative isolate min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div
        className="pointer-events-none absolute inset-x-0 top-[-220px] h-[460px] bg-gradient-to-b from-emerald-200/50 via-transparent to-transparent blur-3xl dark:from-emerald-500/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.3),_transparent_55%)] blur-3xl dark:opacity-60"
        aria-hidden="true"
      />

      <nav className="relative z-10 w-full px-6 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white shadow-lg shadow-green-200/60">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">SalesSnap</span>
            <ThemeToggle compact />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              {content.signIn}
            </Link>
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "tl" : "en")}
              className="rounded-full border border-green-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-green-700 transition hover:border-green-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-green-400 dark:hover:border-green-600"
            >
              {content.languageLabel}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="w-full px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr,0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200/70 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-green-700 shadow-sm dark:border-green-500/40 dark:bg-zinc-900/70 dark:text-green-300">
                SalesSnap
              </div>
              <h1 className="mt-6 text-4xl font-bold leading-tight text-green-900 sm:text-5xl dark:text-green-200">
                {content.heroTagline}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg dark:text-zinc-300">
                {content.heroBody}
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {content.heroHighlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-center gap-3 rounded-2xl border border-green-100/70 bg-white/80 px-4 py-3 text-sm font-semibold text-green-900 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-green-200"
                  >
                    <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-4 text-center text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-200/70 transition hover:shadow-emerald-300/80 dark:shadow-emerald-900/40"
                >
                  <Zap className="h-4 w-4" />
                  {content.heroCta}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-green-200 bg-white/80 px-6 py-4 text-sm font-semibold text-green-700 shadow-sm transition hover:border-green-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-green-300"
                >
                  {content.signIn}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {content.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/40 bg-white/80 p-4 text-left shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <p className="text-3xl font-bold text-green-900 dark:text-green-200">{metric.value}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-zinc-400">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-200/50 to-transparent blur-3xl dark:from-emerald-500/20"
                aria-hidden="true"
              />
              <div className="relative rounded-3xl border border-white/40 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-zinc-400">
                      {content.features[2].title}
                    </p>
                    <p className="mt-2 text-4xl font-bold text-green-700 dark:text-green-300">₱6,230</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    +18%
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {previewData.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-green-100/70 bg-white/80 px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-600 dark:text-zinc-300">
                        <span>{item.title}</span>
                        <span className="text-base text-gray-900 dark:text-zinc-100">{item.amount}</span>
                      </div>
                      <p className="mt-2 text-xs leading-snug text-gray-500 dark:text-zinc-400">{item.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{content.features[2].title}</p>
                  <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-zinc-800">
                    <div className="h-full w-5/6 rounded-full bg-gradient-to-r from-emerald-500 to-green-600" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">{content.features[2].body}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-6 pb-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl border border-green-100/70 bg-white/80 px-6 py-10 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 sm:px-10">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-600 dark:text-green-400">SalesSnap</p>
                <h2 className="mt-2 text-3xl font-bold text-green-900 dark:text-green-200">{content.featuresHeading}</h2>
                <p className="mt-3 text-base text-gray-600 dark:text-zinc-300">{content.featuresDescription}</p>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {content.features.map((feature, index) => {
                  const FeatureIcon = featureIcons[index % featureIcons.length];
                  return (
                    <div
                      key={feature.title}
                      className="group rounded-2xl border border-transparent bg-gradient-to-br from-emerald-50/80 via-white to-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-emerald-200/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 dark:hover:border-emerald-500/30"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 transition group-hover:bg-green-600 group-hover:text-white dark:bg-green-900/40 dark:text-green-300 dark:group-hover:bg-green-800">
                        {FeatureIcon ? <FeatureIcon className="h-5 w-5" /> : null}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{feature.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-6 pb-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-3xl border border-green-100/80 bg-gradient-to-br from-white via-emerald-50 to-green-100/60 px-6 py-12 shadow-xl dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_rgba(15,23,42,0.9))] dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-900/20 sm:px-10">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-700 dark:text-green-400">{content.getStarted}</p>
                <h2 className="mt-2 text-3xl font-bold text-green-900 dark:text-green-100">{content.guideHeading}</h2>
                <p className="mt-3 text-base text-gray-600 dark:text-zinc-300">{content.guideDescription}</p>
              </div>
              <div className="mt-12 relative pl-4 sm:pl-10">
                <div
                  className="pointer-events-none absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-green-200 via-emerald-400 to-green-600 dark:from-emerald-900 dark:via-emerald-600 dark:to-emerald-500 sm:block"
                  aria-hidden="true"
                />
                <div className="space-y-6">
                  {content.guide.map((step, index) => {
                    const Icon = guideIconComponents[step.icon as GuideIconKey];
                    return (
                      <div
                        key={step.title}
                        className="relative rounded-2xl border border-green-100/70 bg-white/90 px-6 py-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:pl-16"
                      >
                        <div
                          className="absolute -left-0 top-6 hidden h-px w-6 bg-gradient-to-r from-green-400 to-green-600 sm:block"
                          aria-hidden="true"
                        />
                        <div className="absolute -left-9 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-base font-bold text-green-700 shadow-lg dark:bg-emerald-950/80 dark:text-green-200 sm:flex">
                          {index + 1}
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-emerald-900/40 dark:text-green-300">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold tracking-[0.3em] text-gray-400 dark:text-zinc-400">
                              {String(index + 1).padStart(2, "0")}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-zinc-100">{step.title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-10 flex flex-col items-center gap-3 text-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-green-700 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-emerald-200/70 transition hover:bg-green-800 dark:bg-emerald-500 dark:text-zinc-950"
                >
                  <Zap className="h-4 w-4" />
                  {content.guideCta}
                </Link>
                <p className="text-sm text-gray-600 dark:text-zinc-400">{content.guideCtaSubtext}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-gray-100/70 py-6 text-center text-sm text-gray-400 dark:border-zinc-800 dark:text-zinc-500">
        © {new Date().getFullYear()} SalesSnap. {content.footer}
      </footer>
    </div>
  );
}
