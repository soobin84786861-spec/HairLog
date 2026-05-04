import { DailySaleEntry, HairSalesManagerData, MonthlySummary } from "../types/sales";
import {
  getCurrentYear,
  getDaysInMonth,
  listDateKeysInMonth,
  listDatesInMonth,
  parseMonthKey,
  toDateKey,
  toMonthKey,
} from "./dateUtils";

function getVisibleDateKeysForMonthlyReport(monthKey: string): string[] {
  const today = new Date();
  const todayMonthKey = toMonthKey(today);

  if (monthKey < todayMonthKey) {
    return listDateKeysInMonth(monthKey);
  }

  if (monthKey > todayMonthKey) {
    return [];
  }

  return listDateKeysInMonth(monthKey).filter((dateKey) => dateKey <= toDateKey(today));
}

export function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getMonthlyGoal(data: HairSalesManagerData, monthKey: string): number {
  return data.monthlyGoals[monthKey] ?? 0;
}

export function getExtraClosedDaySet(data: HairSalesManagerData, monthKey: string): Set<string> {
  return new Set(data.extraClosedDays[monthKey] ?? []);
}

export function isDefaultClosedDay(date: Date): boolean {
  return date.getDay() === 2;
}

export function isClosedDay(data: HairSalesManagerData, dateKey: string): boolean {
  const date = new Date(dateKey);
  if (isDefaultClosedDay(date)) {
    return true;
  }

  return getExtraClosedDaySet(data, toMonthKey(date)).has(dateKey);
}

export function countClosedDays(data: HairSalesManagerData, monthKey: string): number {
  const extraClosedDays = getExtraClosedDaySet(data, monthKey);
  return listDatesInMonth(monthKey).filter((date) => {
    const dateKey = toDateKey(date);
    return isDefaultClosedDay(date) || extraClosedDays.has(dateKey);
  }).length;
}

export function getWorkDays(data: HairSalesManagerData, monthKey: string): number {
  return Math.max(getDaysInMonth(monthKey) - countClosedDays(data, monthKey), 0);
}

export function getDailyTarget(data: HairSalesManagerData, monthKey: string): number {
  const goal = getMonthlyGoal(data, monthKey);
  const workDays = getWorkDays(data, monthKey);
  if (!goal || workDays <= 0) {
    return 0;
  }

  return Math.round(goal / workDays);
}

export function getMonthlySalesEntries(data: HairSalesManagerData, monthKey: string): Array<[string, DailySaleEntry]> {
  return Object.entries(data.sales)
    .filter(([dateKey]) => dateKey.startsWith(monthKey))
    .sort(([a], [b]) => a.localeCompare(b));
}

export function getMonthlySalesTotal(data: HairSalesManagerData, monthKey: string): number {
  return getMonthlySalesEntries(data, monthKey).reduce((sum, [, entry]) => sum + entry.amount, 0);
}

export function getMonthlySummary(data: HairSalesManagerData, monthKey: string): MonthlySummary {
  const goal = getMonthlyGoal(data, monthKey);
  const totalSales = getMonthlySalesTotal(data, monthKey);
  const workDays = getWorkDays(data, monthKey);
  const closedDays = countClosedDays(data, monthKey);
  const dailyTarget = getDailyTarget(data, monthKey);
  const remainingGoal = Math.max(goal - totalSales, 0);
  const achievementRate = goal > 0 ? (totalSales / goal) * 100 : 0;

  return {
    monthKey,
    goal,
    totalSales,
    remainingGoal,
    achievementRate,
    workDays,
    closedDays,
    dailyTarget,
  };
}

export function getTodayMetrics(data: HairSalesManagerData): {
  todayKey: string;
  todaySale: number;
  todayMemo?: string;
  todayTarget: number;
  difference: number;
  isClosed: boolean;
} {
  const today = new Date();
  const todayKey = toDateKey(today);
  const monthKey = toMonthKey(today);
  const todaySale = data.sales[todayKey]?.amount ?? 0;
  const todayMemo = data.sales[todayKey]?.memo;
  const isClosed = isClosedDay(data, todayKey);
  const todayTarget = isClosed ? 0 : getDailyTarget(data, monthKey);

  return {
    todayKey,
    todaySale,
    todayMemo,
    todayTarget,
    difference: todaySale - todayTarget,
    isClosed,
  };
}

export function getRecentSales(data: HairSalesManagerData, limit = 5): Array<[string, DailySaleEntry]> {
  return Object.entries(data.sales)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, limit);
}

export function buildDailySalesChart(data: HairSalesManagerData, monthKey: string) {
  const dailyTarget = getDailyTarget(data, monthKey);
  return getVisibleDateKeysForMonthlyReport(monthKey).map((dateKey) => ({
    dateKey,
    day: Number(dateKey.slice(-2)),
    amount: data.sales[dateKey]?.amount ?? 0,
    target: isClosedDay(data, dateKey) ? 0 : dailyTarget,
    closed: isClosedDay(data, dateKey),
  }));
}

export function buildCumulativeChart(data: HairSalesManagerData, monthKey: string) {
  let running = 0;
  return getVisibleDateKeysForMonthlyReport(monthKey).map((dateKey) => {
    running += data.sales[dateKey]?.amount ?? 0;
    return {
      dateKey,
      day: Number(dateKey.slice(-2)),
      cumulative: running,
    };
  });
}

export function buildYearlyReport(data: HairSalesManagerData, year = getCurrentYear()) {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const summary = getMonthlySummary(data, monthKey);
    return {
      monthKey,
      label: `${monthIndex + 1}월`,
      goal: summary.goal,
      sales: summary.totalSales,
      achievementRate: summary.goal > 0 ? Number(summary.achievementRate.toFixed(1)) : 0,
    };
  });
}

export function getYearTotals(data: HairSalesManagerData, year = getCurrentYear()) {
  const report = buildYearlyReport(data, year);
  const totalGoal = report.reduce((sum, item) => sum + item.goal, 0);
  const totalSales = report.reduce((sum, item) => sum + item.sales, 0);
  const achievementRate = totalGoal > 0 ? (totalSales / totalGoal) * 100 : 0;

  return {
    totalGoal,
    totalSales,
    achievementRate,
  };
}

export function getMonthKeyFromDateKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function getMonthBoundary(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  return {
    start: new Date(year, monthIndex, 1),
    end: new Date(year, monthIndex + 1, 0),
  };
}
