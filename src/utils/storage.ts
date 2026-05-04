import { HairSalesManagerData } from "../types/sales";

export const STORAGE_KEY = "hair_sales_manager_data";

export const EMPTY_DATA: HairSalesManagerData = {
  monthlyGoals: {},
  extraClosedDays: {},
  sales: {},
};

function sanitizeData(input: unknown): HairSalesManagerData {
  if (!input || typeof input !== "object") {
    return EMPTY_DATA;
  }

  const data = input as Partial<HairSalesManagerData>;

  return {
    monthlyGoals: data.monthlyGoals ?? {},
    extraClosedDays: data.extraClosedDays ?? {},
    sales: data.sales ?? {},
  };
}

export function loadData(): HairSalesManagerData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return EMPTY_DATA;
  }

  return sanitizeData(JSON.parse(raw));
}

export function saveData(data: HairSalesManagerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportData(data: HairSalesManagerData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(jsonText: string): HairSalesManagerData {
  return sanitizeData(JSON.parse(jsonText));
}
