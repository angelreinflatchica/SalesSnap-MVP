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
import { sendOrQueue } from "@/lib/offlineSync";
import type { Expense } from "@/types";
import { useDashboardLanguage } from "@/components/layout/DashboardLanguageContext";
import { getDashboardCopy, interpolate } from "@/lib/dashboardCopy";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function createExpenseSchema(labelMessage: string, amountMessage: string) {
  return z.object({
    label: z.string().min(1, labelMessage).max(50),
    amount: z.number({ message: amountMessage }).positive(amountMessage),
  });
}

type ExpenseFormValues = z.infer<ReturnType<typeof createExpenseSchema>>;

interface AddExpenseFormProps {
  expenses: Expense[];
  onSuccess: () => void;
  selectedDate: string;
}

export function AddExpenseForm({ expenses, onSuccess, selectedDate }: AddExpenseFormProps) {
  const { language } = useDashboardLanguage();
  const copy = getDashboardCopy(language);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState(selectedDate);
  const [isUpdating, setIsUpdating] = useState(false);
  const expenseSchema = useMemo(
    () => createExpenseSchema(copy.forms.labelRequired, copy.forms.amountPositive),
    [copy.forms.labelRequired, copy.forms.amountPositive]
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
  });

  async function onSubmit(values: ExpenseFormValues) {
    try {
      const payload = { ...values, date: selectedDate };
      const { queued, response } = await sendOrQueue("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (queued) {
        toast.success("Expense saved offline and queued for sync");
        reset();
        onSuccess();
        return;
      }
      if (!response?.ok) {
        const data = response ? await response.json().catch(() => ({})) : {};
        toast.error(data.error ?? copy.forms.expenseAddFailed);
        return;
      }
      toast.success(copy.forms.expenseAdded);
      reset();
      onSuccess();
    } catch {
      toast.error(copy.forms.expenseAddRetry);
    }
  }

  async function deleteExpense(id: string) {
    try {
      const { queued, response } = await sendOrQueue(`/api/expenses/${id}`, { method: "DELETE" });
      if (queued) {
        toast.success("Expense delete queued for sync");
        onSuccess();
        return;
      }
      if (!response?.ok) {
        toast.error(copy.forms.expenseDeleteFailed);
        return;
      }
      toast.success(copy.forms.expenseRemoved);
      onSuccess();
    } catch {
      toast.error(copy.forms.expenseDeleteRetry);
    }
  }

  function startEdit(expense: Expense) {
    setEditingExpense(expense);
    setEditLabel(expense.label);
    setEditAmount(expense.amount);
    setEditDate(new Date(expense.date).toISOString().slice(0, 10));
  }

  async function saveEdit() {
    if (!editingExpense) return;
    if (!editLabel.trim()) {
      toast.error(copy.forms.labelRequired);
      return;
    }
    if (!Number.isFinite(editAmount) || editAmount <= 0) {
      toast.error(copy.forms.amountPositive);
      return;
    }

    setIsUpdating(true);
    try {
      const { queued, response } = await sendOrQueue(`/api/expenses/${editingExpense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editLabel.trim(),
          amount: editAmount,
          date: editDate,
        }),
      });

      if (queued) {
        toast.success("Expense update queued for sync");
        setEditingExpense(null);
        onSuccess();
        return;
      }

      if (!response?.ok) {
        const data = response ? await response.json().catch(() => ({})) : {};
        toast.error(data.error ?? "Failed to update expense");
        return;
      }

      toast.success("Expense updated");
      setEditingExpense(null);
      onSuccess();
    } catch {
      toast.error("Failed to update expense");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {copy.forms.suggestedLabels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setValue("label", label)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="expense-label">{copy.forms.expenseLabel}</Label>
            <Input
              id="expense-label"
              type="text"
              placeholder={copy.forms.expensePlaceholder}
              {...register("label")}
            />
            {errors.label && (
              <p className="text-xs text-red-600">{errors.label.message}</p>
            )}
          </div>

          <div className="w-full sm:w-36 space-y-1.5">
            <Label htmlFor="expense-amount">{copy.forms.amount}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                ₱
              </span>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="pl-7"
                  {...register("amount", { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-600">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            copy.forms.addExpense
          )}
        </button>
      </form>

      {expenses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {copy.forms.selectedDayExpenses}
          </p>
          <ul className="space-y-1.5">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {expense.label}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {formatPeso(expense.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(expense)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    aria-label="Edit expense"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteExpense(expense.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={interpolate(copy.forms.deleteExpense, { label: expense.label })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-label">Label</Label>
              <Input
                id="edit-expense-label"
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-amount">Amount</Label>
              <Input
                id="edit-expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-date">Date</Label>
              <Input
                id="edit-expense-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditingExpense(null)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
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
