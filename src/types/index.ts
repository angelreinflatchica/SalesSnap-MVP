export interface SalesEntry {
  id: string;
  userId: string;
  amount: number;
  note: string | null;
  date: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface UpdateSaleInput {
  amount?: number;
  note?: string;
  date?: string;
}

export interface Expense {
  id: string;
  userId: string;
  label: string;
  amount: number;
  date: string | Date;
  createdAt: string | Date;
}

export interface User {
  id: string;
  mobileNumber: string;
  businessName: string | null;
  currency: string;
  createdAt: string | Date;
}

export interface DayChartData {
  day: string;
  sales: number;
  expenses: number;
  profit: number;
}

export interface ProfitSummary {
  totalSales: number;
  totalExpenses: number;
  profit: number;
}
