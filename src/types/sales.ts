export type MonthlyGoals = Record<string, number>;
export type ExtraClosedDays = Record<string, string[]>;

export interface DailySaleEntry {
  amount: number;
  memo?: string;
}

export type SalesMap = Record<string, DailySaleEntry>;

export interface HairSalesManagerData {
  monthlyGoals: MonthlyGoals;
  extraClosedDays: ExtraClosedDays;
  sales: SalesMap;
}

export interface MonthlySummary {
  monthKey: string;
  goal: number;
  totalSales: number;
  remainingGoal: number;
  achievementRate: number;
  workDays: number;
  closedDays: number;
  dailyTarget: number;
}

export type AppTab = "home" | "input" | "closed" | "report" | "settings";
