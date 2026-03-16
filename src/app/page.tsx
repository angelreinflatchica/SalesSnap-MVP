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
    heroCta: "Create your free account and start tracking today.",
    guideTitle: "How to Use SalesSnap",
    guideBody:
      "Follow this full guide to set up your account, track daily activity, and review your real profit with confidence.",
    guidePhases: ["Set up once", "Track daily", "Review weekly"],
    guideSteps: [
      {
        title: "Create your account",
        body: "Tap Get Started, fill in your details, and log in to your dashboard.",
      },
      {
        title: "Set your business details",
        body: "Open Settings and add your business name and default preferences.",
      },
      {
        title: "Log your first sale",
        body: "Use the sales form to record item name, quantity, and amount so your records start correctly.",
      },
      {
        title: "Log every sale during the day",
        body: "Use the sales form each time you make a sale so your totals stay accurate.",
      },
      {
        title: "Add all daily expenses",
        body: "Record your costs like ingredients, transport, and packaging on the same day.",
      },
      {
        title: "Use Bulk Expense for shared costs",
        body: "If one expense covers multiple days (like monthly rent or weekly stock), use Bulk Expense so the cost is spread instead of charged to one day only.",
      },
      {
        title: "Check your dashboard before closing",
        body: "Review total sales, expenses, and profit to confirm your actual earnings for the day.",
      },
      {
        title: "Review summary and history",
        body: "Check Dashboard, Summary, and History to see trends and make better decisions.",
      },
    ],
    routineTitle: "Daily routine in SalesSnap",
    routineItems: [
      "Morning: open Dashboard and check yesterday's numbers.",
      "During sales: log every transaction immediately.",
      "After spending: add expenses as soon as they happen.",
      "End of day: compare total sales vs total expenses.",
      "Weekly: open Summary and History to spot patterns.",
    ],
    tipsTitle: "Best practices",
    tipsItems: [
      "Do not batch entries at the end of the week; real-time logs are more accurate.",
      "Use clear notes for unusual expenses so you remember why they happened.",
      "Review profit trends every weekend to adjust pricing or inventory.",
    ],
    faqTitle: "Frequently asked questions",
    faqBody: "Quick answers to help you use SalesSnap smoothly.",
    faqItems: [
      {
        question: "Can I edit a sale or expense after saving?",
        answer:
          "Yes. Open your records from History or the related list, then update the entry if you need to correct amounts or notes.",
      },
      {
        question: "What if I forgot to log transactions earlier?",
        answer:
          "You can still add missing sales or expenses later. For best accuracy, enter entries as soon as they happen.",
      },
      {
        question: "How is profit calculated?",
        answer:
          "SalesSnap computes profit as total sales minus total expenses, so you can see your real earnings instantly.",
      },
      {
        question: "What is Bulk Expense and when should I use it?",
        answer:
          "Use Bulk Expense when a cost should be distributed across several days, such as rent, utilities, or supplies bought in advance. This keeps daily profit reports fair and realistic.",
      },
      {
        question: "Can I use SalesSnap on my phone?",
        answer:
          "Yes. SalesSnap is designed to work on mobile and desktop so you can track anytime.",
      },
      {
        question: "Where do I see trends over time?",
        answer:
          "Use Summary and History to compare days and weeks, then decide on pricing, inventory, and spending.",
      },
    ],
    guideActions: {
      primary: "Start with a free account",
      secondary: "Already registered? Sign in",
    },
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
    guideTitle: "Paano Gamitin ang SalesSnap",
    guideBody:
      "Sundin ang kumpletong gabay na ito para ma-set up ang account, ma-track ang araw-araw na galaw, at makita ang tunay na tubo nang may kumpiyansa.",
    guidePhases: ["Isang beses na setup", "Araw-araw na tracking", "Lingguhang review"],
    guideSteps: [
      {
        title: "Gumawa ng account",
        body: "Pindutin ang Magsimula, ilagay ang iyong detalye, at mag-log in sa dashboard.",
      },
      {
        title: "I-set ang detalye ng negosyo",
        body: "Buksan ang Settings at ilagay ang pangalan ng negosyo at default na preferences.",
      },
      {
        title: "Itala ang unang benta",
        body: "Gamitin ang sales form para sa pangalan ng item, dami, at halaga para tama ang panimulang records mo.",
      },
      {
        title: "Itala ang bawat benta sa buong araw",
        body: "Gamitin ang sales form sa bawat benta para laging tama ang totals mo.",
      },
      {
        title: "Ilagay lahat ng arawang gastos",
        body: "Itala agad ang gastos tulad ng sangkap, pamasahe, at packaging sa parehong araw.",
      },
      {
        title: "Gamitin ang Bulk Expense para sa pinaghahatian na gastos",
        body: "Kung ang isang gastos ay para sa maraming araw (tulad ng renta kada buwan o stocks para sa isang linggo), gamitin ang Bulk Expense para maikalat ang gastos at hindi mabigat sa isang araw lang.",
      },
      {
        title: "Suriin ang dashboard bago magsara",
        body: "Tingnan ang total sales, expenses, at profit para makumpirma ang tunay na kita ngayong araw.",
      },
      {
        title: "Suriin ang summary at history",
        body: "Tingnan ang Dashboard, Summary, at History para makita ang trends at mas mahusay na makapagdesisyon.",
      },
    ],
    routineTitle: "Araw-araw na routine sa SalesSnap",
    routineItems: [
      "Umaga: buksan ang Dashboard at tingnan ang bilang kahapon.",
      "Habang nagbebenta: itala agad ang bawat transaksyon.",
      "Pag may gastos: ilagay agad para hindi makalimutan.",
      "Bago matapos ang araw: ikumpara ang total sales at total expenses.",
      "Lingguhan: buksan ang Summary at History para makita ang pattern.",
    ],
    tipsTitle: "Mga magandang practice",
    tipsItems: [
      "Huwag ipunin ang entries sa dulo ng linggo; mas tama ang real-time logging.",
      "Gumamit ng malinaw na notes sa hindi pangkaraniwang gastos para maalala mo ang dahilan.",
      "Suriin ang profit trend tuwing weekend para maayos ang presyo o inventory.",
    ],
    faqTitle: "Madalas na tanong",
    faqBody: "Mabilis na sagot para mas madali mong magamit ang SalesSnap.",
    faqItems: [
      {
        question: "Pwede ko bang i-edit ang benta o gastos matapos i-save?",
        answer:
          "Oo. Buksan ang records sa History o sa kaukulang listahan, tapos i-update ang entry kung may kailangang itama.",
      },
      {
        question: "Paano kung nakalimutan kong mag-log kanina?",
        answer:
          "Pwede mo pa ring idagdag ang kulang na benta o gastos mamaya. Para mas accurate, itala agad kapag nangyari.",
      },
      {
        question: "Paano kino-compute ang profit?",
        answer:
          "Kinakalkula ng SalesSnap ang profit bilang total sales minus total expenses para makita mo agad ang tunay na kita.",
      },
      {
        question: "Ano ang Bulk Expense at kailan ito gagamitin?",
        answer:
          "Gamitin ang Bulk Expense kapag ang gastos ay dapat hatiin sa ilang araw, tulad ng renta, kuryente, o supplies na binili nang maramihan. Mas nagiging patas at realistic ang daily profit report.",
      },
      {
        question: "Pwede ba ang SalesSnap sa phone?",
        answer:
          "Oo. Dinisenyo ang SalesSnap para gumana sa mobile at desktop para makapag-track ka kahit saan.",
      },
      {
        question: "Saan ko makikita ang trends sa paglipas ng panahon?",
        answer:
          "Gamitin ang Summary at History para maikumpara ang mga araw at linggo, at makagawa ng mas magandang desisyon.",
      },
    ],
    guideActions: {
      primary: "Magsimula gamit ang libreng account",
      secondary: "May account ka na? Mag-sign in",
    },
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
      <nav className="flex w-full flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">SalesSnap</span>
        </div>
        <div className="flex w-full items-center justify-center gap-3 sm:w-auto sm:justify-end">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            {content.signIn}
          </Link>
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "tl" : "en")}
            role="switch"
            aria-checked={language === "tl"}
            aria-label="Toggle language between English and Tagalog"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-green-200 bg-white px-2.5 transition-colors hover:border-green-300 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-green-100 p-0.5 dark:bg-green-950/40">
              <span
                className={`h-4 w-4 rounded-full bg-green-600 shadow-sm transition-transform ${
                  language === "tl" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-zinc-200">
              {language === "en" ? "English" : "Tagalog"}
            </span>
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
        <div className="mx-auto mb-12 max-w-5xl rounded-3xl border border-green-100 bg-white/95 p-6 shadow-sm sm:p-8 dark:border-green-900/40 dark:bg-zinc-900/90">
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-300 sm:text-3xl">
            {content.guideTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-300 sm:text-base">
            {content.guideBody}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {content.guidePhases.map((phase) => (
              <span
                key={phase}
                className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-green-300"
              >
                {phase}
              </span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.guideSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-green-100 bg-green-50/60 p-5 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mb-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-green-600 px-2 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-300">
                {content.routineTitle}
              </h3>
              <ul className="mt-3 space-y-2">
                {content.routineItems.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <h3 className="text-base font-semibold text-amber-900 dark:text-amber-300">{content.tipsTitle}</h3>
              <ul className="mt-3 space-y-2">
                {content.tipsItems.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-green-200 bg-white p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                {content.guideActions.primary}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-green-200 px-5 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 dark:border-zinc-600 dark:text-green-300 dark:hover:bg-zinc-700"
              >
                {content.guideActions.secondary}
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/70 p-5 dark:border-sky-900/40 dark:bg-sky-950/20">
            <h3 className="text-base font-semibold text-sky-900 dark:text-sky-300">{content.faqTitle}</h3>
            <p className="mt-2 text-sm text-sky-800 dark:text-sky-200">{content.faqBody}</p>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {content.faqItems.map((item) => (
                <div key={item.question} className="rounded-xl border border-sky-100 bg-white/90 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{item.question}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

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
