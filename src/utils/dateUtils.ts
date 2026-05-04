const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
});

export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function toDateKey(date: Date): string {
  return `${toMonthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseMonthKey(monthKey: string): { year: number; monthIndex: number } {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

export function getMonthDate(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day);
}

export function getDaysInMonth(monthKey: string): number {
  const { year, monthIndex } = parseMonthKey(monthKey);
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function listDatesInMonth(monthKey: string): Date[] {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const days = getDaysInMonth(monthKey);
  return Array.from({ length: days }, (_, index) => getMonthDate(year, monthIndex, index + 1));
}

export function listDateKeysInMonth(monthKey: string): string[] {
  return listDatesInMonth(monthKey).map(toDateKey);
}

export function isTuesday(date: Date): boolean {
  return date.getDay() === 2;
}

export function isToday(dateKey: string): boolean {
  return dateKey === toDateKey(new Date());
}

export function formatDayLabel(dateKey: string): string {
  return DATE_FORMATTER.format(new Date(dateKey));
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${year}년 ${month}월`;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getTodayMonthKey(): string {
  return toMonthKey(new Date());
}

export function createMonthOptions(centerMonthKey: string, radius = 6): string[] {
  const { year, monthIndex } = parseMonthKey(centerMonthKey);
  return Array.from({ length: radius * 2 + 1 }, (_, offset) => {
    const date = new Date(year, monthIndex + offset - radius, 1);
    return toMonthKey(date);
  });
}

export function createYearOptions(centerYear: number, radius = 3): number[] {
  return Array.from({ length: radius * 2 + 1 }, (_, index) => centerYear - radius + index);
}
