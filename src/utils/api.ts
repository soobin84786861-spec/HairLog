import { HairSalesManagerData } from "../types/sales";

interface SalesItem {
  date: string;
  amount: number;
  memo?: string;
}

interface GoalItem {
  month: string;
  goalAmount: number;
}

interface ClosedDayItem {
  date: string;
  type: string;
  memo?: string;
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? "API request failed");
  }

  return response.json() as Promise<T>;
}

export async function fetchMonthData(monthKey: string): Promise<HairSalesManagerData> {
  const [salesResponse, goalsResponse, closedDaysResponse] = await Promise.all([
    requestJson<{ items: SalesItem[] }>(`/api/sales?month=${monthKey}`),
    requestJson<{ item: GoalItem | null }>(`/api/goals?month=${monthKey}`),
    requestJson<{ items: ClosedDayItem[] }>(`/api/closed-days?month=${monthKey}`),
  ]);

  return {
    monthlyGoals: goalsResponse.item ? { [monthKey]: goalsResponse.item.goalAmount } : {},
    extraClosedDays: {
      [monthKey]: closedDaysResponse.items.map((item) => item.date),
    },
    sales: Object.fromEntries(
      salesResponse.items.map((item) => [
        item.date,
        {
          amount: item.amount,
          memo: item.memo ?? "",
        },
      ]),
    ),
  };
}

export async function fetchYearData(year: number): Promise<HairSalesManagerData> {
  const monthKeys = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
  const monthlyData = await Promise.all(monthKeys.map((monthKey) => fetchMonthData(monthKey)));

  return monthlyData.reduce<HairSalesManagerData>(
    (accumulator, item) => ({
      monthlyGoals: {
        ...accumulator.monthlyGoals,
        ...item.monthlyGoals,
      },
      extraClosedDays: {
        ...accumulator.extraClosedDays,
        ...item.extraClosedDays,
      },
      sales: {
        ...accumulator.sales,
        ...item.sales,
      },
    }),
    {
      monthlyGoals: {},
      extraClosedDays: {},
      sales: {},
    },
  );
}

export async function saveSaleToApi(date: string, amount: number, memo: string) {
  return requestJson<{ item: SalesItem }>("/api/sales", {
    method: "POST",
    body: JSON.stringify({
      date,
      amount,
      memo,
    }),
  });
}

export async function saveGoalToApi(month: string, goalAmount: number) {
  return requestJson<{ item: GoalItem }>("/api/goals", {
    method: "POST",
    body: JSON.stringify({
      month,
      goalAmount,
    }),
  });
}

export async function saveClosedDayToApi(date: string, type: string, memo = "") {
  return requestJson<{ item: ClosedDayItem }>("/api/closed-days", {
    method: "POST",
    body: JSON.stringify({
      date,
      type,
      memo,
    }),
  });
}
