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

const GET_CACHE_TTL_MS = 30_000;
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inflightGetRequests = new Map<string, Promise<unknown>>();
const monthDataCache = new Map<string, Promise<HairSalesManagerData>>();
const yearDataCache = new Map<number, Promise<HairSalesManagerData>>();

function getCacheKey(input: string, method = "GET") {
  return `${method}:${input}`;
}

function readCachedValue<T>(cacheKey: string) {
  const cached = responseCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.value as T;
}

function writeCachedValue<T>(cacheKey: string, value: T) {
  responseCache.set(cacheKey, {
    expiresAt: Date.now() + GET_CACHE_TTL_MS,
    value,
  });
}

function clearGetCacheForMonth(monthKey: string) {
  responseCache.delete(getCacheKey(`/api/sales?month=${monthKey}`));
  responseCache.delete(getCacheKey(`/api/goals?month=${monthKey}`));
  responseCache.delete(getCacheKey(`/api/closed-days?month=${monthKey}`));
  monthDataCache.delete(monthKey);
  yearDataCache.delete(Number(monthKey.slice(0, 4)));
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const cacheKey = getCacheKey(input, method);

  if (method === "GET") {
    const cached = readCachedValue<T>(cacheKey);
    if (cached) {
      return cached;
    }

    const inflight = inflightGetRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const requestPromise = (async () => {
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

    const payload = (await response.json()) as T;
    if (method === "GET") {
      writeCachedValue(cacheKey, payload);
    }

    return payload;
  })();

  if (method === "GET") {
    inflightGetRequests.set(cacheKey, requestPromise);
  }

  try {
    return await requestPromise;
  } finally {
    if (method === "GET") {
      inflightGetRequests.delete(cacheKey);
    }
  }
}

export async function fetchMonthData(monthKey: string): Promise<HairSalesManagerData> {
  const cached = monthDataCache.get(monthKey);
  if (cached) {
    return cached;
  }

  const request = (async () => {
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
  })();

  monthDataCache.set(monthKey, request);

  try {
    return await request;
  } catch (error) {
    monthDataCache.delete(monthKey);
    throw error;
  }
}

export async function fetchYearData(year: number): Promise<HairSalesManagerData> {
  const cached = yearDataCache.get(year);
  if (cached) {
    return cached;
  }

  const request = (async () => {
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
  })();

  yearDataCache.set(year, request);

  try {
    return await request;
  } catch (error) {
    yearDataCache.delete(year);
    throw error;
  }
}

export async function saveSaleToApi(date: string, amount: number, memo: string) {
  const result = await requestJson<{ item: SalesItem }>("/api/sales", {
    method: "POST",
    body: JSON.stringify({
      date,
      amount,
      memo,
    }),
  });

  clearGetCacheForMonth(date.slice(0, 7));
  return result;
}

export async function saveGoalToApi(month: string, goalAmount: number) {
  const result = await requestJson<{ item: GoalItem }>("/api/goals", {
    method: "POST",
    body: JSON.stringify({
      month,
      goalAmount,
    }),
  });

  clearGetCacheForMonth(month);
  return result;
}

export async function saveClosedDayToApi(date: string, type: string, memo = "") {
  const result = await requestJson<{ item: ClosedDayItem }>("/api/closed-days", {
    method: "POST",
    body: JSON.stringify({
      date,
      type,
      memo,
    }),
  });

  clearGetCacheForMonth(date.slice(0, 7));
  return result;
}
