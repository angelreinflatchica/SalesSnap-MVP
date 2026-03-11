type SummaryLanguage = "en" | "tl";

type SummaryInput = {
  businessName?: string | null;
  language: SummaryLanguage;
  dateLabel: string;
  totalSales: number;
  totalExpenses: number;
  profit: number;
  previousProfit: number;
  topExpenseLabel: string | null;
  topExpenseAmount: number;
};

type SummaryResult = {
  text: string;
  provider: "groq" | "gemini" | "fallback";
};

function formatPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function safePctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function fallbackSummary(input: SummaryInput): string {
  const pct = safePctChange(input.profit, input.previousProfit);
  const trend = pct >= 0 ? "higher" : "lower";

  if (input.language === "tl") {
    if (input.totalSales === 0 && input.totalExpenses === 0) {
      return `Walang naitalang benta o gastos noong ${input.dateLabel}. Subukang mag-log ng entries para makabuo tayo ng mas kumpletong daily summary.`;
    }

    const topExpenseText = input.topExpenseLabel
      ? ` Pinakamalaking gastos mo ay ${input.topExpenseLabel} na ${formatPeso(input.topExpenseAmount)}.`
      : "";

    return `Narito ang buod mo noong ${input.dateLabel}: kumita ka ng ${formatPeso(input.profit)} mula sa benta na ${formatPeso(input.totalSales)} at gastos na ${formatPeso(input.totalExpenses)}. Iyan ay ${Math.abs(pct).toFixed(0)}% ${trend === "higher" ? "mas mataas" : "mas mababa"} kumpara kahapon.${topExpenseText}`;
  }

  if (input.totalSales === 0 && input.totalExpenses === 0) {
    return `No sales or expenses were recorded on ${input.dateLabel}. Add entries to get a smarter end-of-day insight.`;
  }

  const topExpenseText = input.topExpenseLabel
    ? ` Your biggest expense was ${input.topExpenseLabel} at ${formatPeso(input.topExpenseAmount)}.`
    : "";

  return `Here is your summary for ${input.dateLabel}: your profit was ${formatPeso(input.profit)} from sales of ${formatPeso(input.totalSales)} and expenses of ${formatPeso(input.totalExpenses)}. That's ${Math.abs(pct).toFixed(0)}% ${trend} than yesterday.${topExpenseText}`;
}

function buildPrompt(input: SummaryInput): string {
  const pct = safePctChange(input.profit, input.previousProfit).toFixed(0);

  if (input.language === "tl") {
    return [
      "Gumawa ng maikling daily business summary sa Filipino/Tagalog.",
      "Style: natural, friendly, practical. Huwag masyadong mahaba.",
      "Rules:",
      "- 2 hanggang 4 pangungusap lang.",
      "- Banggitin ang profit, paghahambing sa kahapon, at pinakamalaking expense kung meron.",
      "- Gamitin ang data lang sa ibaba, huwag mag-imbento.",
      "- Huwag gumamit ng markdown o bullet points.",
      `Business: ${input.businessName ?? "My Business"}`,
      `Date: ${input.dateLabel}`,
      `Sales: ${formatPeso(input.totalSales)}`,
      `Expenses: ${formatPeso(input.totalExpenses)}`,
      `Profit: ${formatPeso(input.profit)}`,
      `Yesterday Profit: ${formatPeso(input.previousProfit)}`,
      `Percent vs Yesterday: ${pct}%`,
      `Top Expense Label: ${input.topExpenseLabel ?? "None"}`,
      `Top Expense Amount: ${formatPeso(input.topExpenseAmount)}`,
    ].join("\n");
  }

  return [
    "Write a short plain-language daily business summary in English.",
    "Style: natural, friendly, practical.",
    "Rules:",
    "- Keep it to 2 to 4 sentences.",
    "- Mention profit, comparison vs yesterday, and biggest expense if available.",
    "- Use only the data below. Do not invent numbers.",
    "- No markdown or bullet points.",
    `Business: ${input.businessName ?? "My Business"}`,
    `Date: ${input.dateLabel}`,
    `Sales: ${formatPeso(input.totalSales)}`,
    `Expenses: ${formatPeso(input.totalExpenses)}`,
    `Profit: ${formatPeso(input.profit)}`,
    `Yesterday Profit: ${formatPeso(input.previousProfit)}`,
    `Percent vs Yesterday: ${pct}%`,
    `Top Expense Label: ${input.topExpenseLabel ?? "None"}`,
    `Top Expense Amount: ${formatPeso(input.topExpenseAmount)}`,
  ].join("\n");
}

async function generateWithGroq(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 180,
      messages: [
        { role: "system", content: "You are a finance assistant for small businesses." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

async function generateWithGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { temperature: 0.4, maxOutputTokens: 220 },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

export async function generateSmartSummary(input: SummaryInput): Promise<SummaryResult> {
  const prompt = buildPrompt(input);
  const provider = (process.env.AI_PROVIDER ?? "groq").toLowerCase();

  try {
    if (provider === "gemini") {
      const gemini = await generateWithGemini(prompt);
      if (gemini) return { text: gemini, provider: "gemini" };
      const groq = await generateWithGroq(prompt);
      if (groq) return { text: groq, provider: "groq" };
    } else {
      const groq = await generateWithGroq(prompt);
      if (groq) return { text: groq, provider: "groq" };
      const gemini = await generateWithGemini(prompt);
      if (gemini) return { text: gemini, provider: "gemini" };
    }
  } catch {
    // Fallback below
  }

  return { text: fallbackSummary(input), provider: "fallback" };
}
