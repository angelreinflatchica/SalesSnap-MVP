"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPeso } from "@/lib/formatCurrency";
import type { SalesEntry } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy } from "@/lib/dashboardCopy";
import { sendOrQueue } from "@/lib/offlineSync";

function createSalesSchema(amountMessage: string) {
  return z.object({
    amount: z.number({ message: amountMessage }).positive(amountMessage),
    note: z.string().optional(),
  });
}

type SalesFormValues = z.infer<ReturnType<typeof createSalesSchema>>;

interface LogSalesFormProps {
  sales: SalesEntry[];
  onSuccess: () => void;
  selectedDate: string;
}

export function LogSalesForm({ sales, onSuccess, selectedDate }: LogSalesFormProps) {
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);
  const [editingSale, setEditingSale] = useState<SalesEntry | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>("");
  const [editDate, setEditDate] = useState<string>(selectedDate);
  const [isUpdating, setIsUpdating] = useState(false);
  const salesSchema = useMemo(
    () => createSalesSchema(copy.forms.amountPositive),
    [copy.forms.amountPositive]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
  });

  async function onSubmit(values: SalesFormValues) {
    try {
      const payload = { ...values, date: selectedDate };
      const { queued, response } = await sendOrQueue("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (queued) {
        toast.success("Sale saved offline and queued for sync");
        reset();
        onSuccess();
        return;
      }
      if (!response?.ok) {
        const data = response ? await response.json().catch(() => ({})) : {};
        toast.error(data.error ?? copy.forms.saleFailed);
        return;
      }
      toast.success(copy.forms.saleLogged);
      reset();
      onSuccess();
    } catch {
      toast.error(copy.forms.saleFailedRetry);
    }
  }

  function startEdit(sale: SalesEntry) {
    setEditingSale(sale);
    setEditAmount(sale.amount);
    setEditNote(sale.note ?? "");
    setEditDate(new Date(sale.date).toISOString().slice(0, 10));
  }

  async function saveEdit() {
    if (!editingSale) return;
    if (!Number.isFinite(editAmount) || editAmount <= 0) {
      toast.error(copy.forms.amountPositive);
      return;
    }

    setIsUpdating(true);
    try {
      const { queued, response } = await sendOrQueue(`/api/sales/${editingSale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: editAmount,
          note: editNote,
          date: editDate,
        }),
      });

      if (queued) {
        toast.success("Sale update queued for sync");
        setEditingSale(null);
        onSuccess();
        return;
      }

      if (!response?.ok) {
        const data = response ? await response.json().catch(() => ({})) : {};
        toast.error(data.error ?? "Failed to update sale");
        return;
      }

      toast.success("Sale updated");
      setEditingSale(null);
      onSuccess();
    } catch {
      toast.error("Failed to update sale");
    } finally {
      setIsUpdating(false);
    }
  }

  async function deleteSale(id: string) {
    if (!window.confirm("Delete this sale?")) return;
    try {
      const { queued, response } = await sendOrQueue(`/api/sales/${id}`, { method: "DELETE" });
      if (queued) {
        toast.success("Sale delete queued for sync");
        onSuccess();
        return;
      }
      if (!response?.ok) {
        toast.error("Failed to delete sale");
        return;
      }
      toast.success("Sale deleted");
      onSuccess();
    } catch {
      toast.error("Failed to delete sale");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="sale-amount">{copy.forms.salesAmount}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-zinc-400">
              ₱
            </span>
            <Input
              id="sale-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="pl-7"
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sale-note">{copy.forms.noteOptional}</Label>
          <Input
            id="sale-note"
            type="text"
            placeholder={copy.forms.salesNotePlaceholder}
            {...register("note")}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            copy.forms.logSale
          )}
        </button>
      </form>

      {sales.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
            Sales on selected day
          </p>
          <ul className="space-y-1.5">
            {sales.map((sale) => (
              <li
                key={sale.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-zinc-700/50 dark:bg-zinc-800/50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{formatPeso(sale.amount)}</p>
                  {sale.note && <p className="text-xs text-gray-500 dark:text-zinc-400">{sale.note}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(sale)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors dark:text-zinc-600 dark:hover:text-blue-400 dark:hover:bg-blue-950/40"
                    aria-label="Edit sale"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSale(sale.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-950/40"
                    aria-label="Delete sale"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-sale-amount">Amount</Label>
              <Input
                id="edit-sale-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sale-note">Note</Label>
              <Input
                id="edit-sale-note"
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sale-date">Date</Label>
              <Input
                id="edit-sale-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditingSale(null)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={isUpdating}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {isUpdating ? "Saving..." : "Save changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
