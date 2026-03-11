import type { SalesEntry, Expense } from "@/types";
import { format, parseISO } from "date-fns";

export interface GroupedEntry {
  date: string;
  sales: SalesEntry[];
  expenses: Expense[];
  totalSales: number;
  totalExpenses: number;
  profit: number;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Excel Export ────────────────────────────────────────────────────────────

export async function exportToExcel(
  data: GroupedEntry[],
  businessName: string,
  period: string
) {
  const { utils, writeFile } = await import("xlsx");

  const wb = utils.book_new();

  // ── Sheet 1: Daily Summary ─────────────────────────────────────────────────
  const summaryRows: (string | number)[][] = [
    [`${businessName} — Sales Report`],
    [`Period: ${period}`],
    [`Generated: ${format(new Date(), "MMMM d, yyyy h:mm a")}`],
    [],
    ["Date", "Sales (₱)", "Expenses (₱)", "Profit (₱)"],
    ...data.map((g) => [
      format(parseISO(g.date), "MMMM d, yyyy (EEE)"),
      g.totalSales,
      g.totalExpenses,
      g.profit,
    ]),
    [],
    [
      "TOTAL",
      data.reduce((s, g) => s + g.totalSales, 0),
      data.reduce((s, g) => s + g.totalExpenses, 0),
      data.reduce((s, g) => s + g.profit, 0),
    ],
  ];

  const wsS = utils.aoa_to_sheet(summaryRows);
  // Column widths
  wsS["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  utils.book_append_sheet(wb, wsS, "Daily Summary");

  // ── Sheet 2: Transaction Details ──────────────────────────────────────────
  const detailRows: (string | number | null)[][] = [
    ["Date", "Type", "Description", "Amount (₱)"],
  ];

  for (const g of data) {
    const dateLabel = format(parseISO(g.date), "MMMM d, yyyy (EEE)");
    for (const s of g.sales) {
      detailRows.push([dateLabel, "Sale", s.note ?? "—", s.amount]);
    }
    for (const e of g.expenses) {
      detailRows.push([dateLabel, "Expense", e.label, -e.amount]);
    }
  }

  const wsD = utils.aoa_to_sheet(detailRows);
  wsD["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 30 }, { wch: 16 }];
  utils.book_append_sheet(wb, wsD, "Transactions");

  const fileName = `SalesSnap_${period.replace(/\s/g, "_")}_${format(new Date(), "yyyyMMdd")}.xlsx`;
  writeFile(wb, fileName);
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

export async function exportToPDF(
  data: GroupedEntry[],
  businessName: string,
  period: string
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(businessName || "Sales Report", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Period: ${period}`, pageWidth / 2, 25, { align: "center" });
  doc.text(
    `Generated: ${format(new Date(), "MMMM d, yyyy h:mm a")}`,
    pageWidth / 2,
    30,
    { align: "center" }
  );
  doc.setTextColor(0);

  // ── Summary Table ──────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Daily Summary", 14, 40);

  const totalSales = data.reduce((s, g) => s + g.totalSales, 0);
  const totalExpenses = data.reduce((s, g) => s + g.totalExpenses, 0);
  const totalProfit = data.reduce((s, g) => s + g.profit, 0);

  autoTable(doc, {
    startY: 43,
    head: [["Date", "Sales", "Expenses", "Profit"]],
    body: [
      ...data.map((g) => [
        format(parseISO(g.date), "MMM d, yyyy (EEE)"),
        formatAmount(g.totalSales),
        formatAmount(g.totalExpenses),
        formatAmount(g.profit),
      ]),
      [
        { content: "TOTAL", styles: { fontStyle: "bold" } },
        { content: formatAmount(totalSales), styles: { fontStyle: "bold", textColor: [22, 101, 52] } },
        { content: formatAmount(totalExpenses), styles: { fontStyle: "bold", textColor: [185, 28, 28] } },
        {
          content: formatAmount(totalProfit),
          styles: {
            fontStyle: "bold",
            textColor: totalProfit >= 0 ? [22, 101, 52] : [185, 28, 28],
          },
        },
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: "right", cellWidth: 38 },
      2: { halign: "right", cellWidth: 38 },
      3: { halign: "right", cellWidth: 38 },
    },
  });

  // ── Transaction Detail Table ───────────────────────────────────────────────
  const lastY = (doc as InstanceType<typeof jsPDF> & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Details", 14, lastY + 10);

  const detailBody: (string | { content: string; styles: object })[][] = [];
  for (const g of data) {
    const dateLabel = format(parseISO(g.date), "MMM d, yyyy (EEE)");
    for (const s of g.sales) {
      detailBody.push([dateLabel, "Sale", s.note ?? "—", formatAmount(s.amount)]);
    }
    for (const e of g.expenses) {
      detailBody.push([
        dateLabel,
        "Expense",
        e.label,
        { content: `(${formatAmount(e.amount)})`, styles: { textColor: [185, 28, 28] } },
      ]);
    }
  }

  autoTable(doc, {
    startY: lastY + 13,
    head: [["Date", "Type", "Description", "Amount"]],
    body: detailBody,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 20 },
      2: { cellWidth: 85 },
      3: { halign: "right", cellWidth: 30 },
    },
  });

  const fileName = `SalesSnap_${period.replace(/\s/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
