import { useEffect, useMemo, useState } from "react";
import { BottomTabBar } from "./components/BottomTabBar";
import { ClosedDaysPage } from "./pages/ClosedDaysPage";
import { HomePage } from "./pages/HomePage";
import { ReportPage } from "./pages/ReportPage";
import { SalesInputPage } from "./pages/SalesInputPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AppTab, HairSalesManagerData } from "./types/sales";
import {
  fetchMonthData,
  fetchYearData,
  saveClosedDayToApi,
  saveGoalToApi,
  saveSaleToApi,
} from "./utils/api";
import { createMonthOptions, getCurrentYear, getTodayMonthKey } from "./utils/dateUtils";
import { EMPTY_DATA } from "./utils/storage";

function replaceMonthSlice(current: HairSalesManagerData, monthKey: string, incoming: HairSalesManagerData): HairSalesManagerData {
  const nextSales = Object.fromEntries(
    Object.entries(current.sales).filter(([dateKey]) => !dateKey.startsWith(monthKey)),
  );
  const nextGoals = Object.fromEntries(
    Object.entries(current.monthlyGoals).filter(([storedMonthKey]) => storedMonthKey !== monthKey),
  );
  const nextClosedDays = Object.fromEntries(
    Object.entries(current.extraClosedDays).filter(([storedMonthKey]) => storedMonthKey !== monthKey),
  );

  return {
    monthlyGoals: {
      ...nextGoals,
      ...incoming.monthlyGoals,
    },
    extraClosedDays: {
      ...nextClosedDays,
      ...incoming.extraClosedDays,
    },
    sales: {
      ...nextSales,
      ...incoming.sales,
    },
  };
}

function replaceYearSlice(current: HairSalesManagerData, year: number, incoming: HairSalesManagerData): HairSalesManagerData {
  const yearPrefix = `${year}-`;
  const nextSales = Object.fromEntries(
    Object.entries(current.sales).filter(([dateKey]) => !dateKey.startsWith(yearPrefix)),
  );
  const nextGoals = Object.fromEntries(
    Object.entries(current.monthlyGoals).filter(([monthKey]) => !monthKey.startsWith(yearPrefix)),
  );
  const nextClosedDays = Object.fromEntries(
    Object.entries(current.extraClosedDays).filter(([monthKey]) => !monthKey.startsWith(yearPrefix)),
  );

  return {
    monthlyGoals: {
      ...nextGoals,
      ...incoming.monthlyGoals,
    },
    extraClosedDays: {
      ...nextClosedDays,
      ...incoming.extraClosedDays,
    },
    sales: {
      ...nextSales,
      ...incoming.sales,
    },
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [data, setData] = useState<HairSalesManagerData>(EMPTY_DATA);
  const [selectedMonth, setSelectedMonth] = useState(getTodayMonthKey());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMonth = async () => {
      try {
        const monthData = await fetchMonthData(selectedMonth);
        setData((prev) => replaceMonthSlice(prev, selectedMonth, monthData));
        setError(null);
      } catch (loadError) {
        console.error(loadError);
        setError("선택한 월의 시트 데이터를 불러오지 못했어요.");
      }
    };

    void loadMonth();
  }, [selectedMonth]);

  useEffect(() => {
    if (activeTab !== "report") {
      return;
    }

    const loadYear = async () => {
      try {
        const yearData = await fetchYearData(selectedYear);
        setData((prev) => replaceYearSlice(prev, selectedYear, yearData));
        setError(null);
      } catch (loadError) {
        console.error(loadError);
        setError("연간 리포트용 시트 데이터를 불러오지 못했어요.");
      }
    };

    void loadYear();
  }, [activeTab, selectedYear]);

  const monthOptions = useMemo(() => createMonthOptions(selectedMonth, 9), [selectedMonth]);
  const settingsMonthOptions = useMemo(() => createMonthOptions(getTodayMonthKey(), 2), []);

  useEffect(() => {
    if (!message && !error) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [message, error]);

  return (
    <div className="min-h-screen px-4 pb-4 pt-5 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[430px] flex-col">
        <header className="mb-5 flex justify-center">
          <div className="relative w-full overflow-hidden rounded-[32px] border border-white/80 bg-white/75 px-6 py-5 text-center shadow-soft backdrop-blur">
            <div className="absolute -left-6 top-0 h-20 w-20 rounded-full bg-brand-100/80 blur-2xl" />
            <div className="absolute -right-6 bottom-0 h-20 w-20 rounded-full bg-amber-200/70 blur-2xl" />

            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-brand-700/70">
                Yubin Designer
              </p>
              <div className="mt-2 flex items-end justify-center gap-2">
                <span className="rounded-full bg-gradient-to-r from-brand-600 to-amber-400 px-4 py-1 text-[28px] font-black tracking-[-0.05em] text-white shadow-lg shadow-orange-200/60">
                  유빈 목표
                </span>
              </div>
              <p className="mt-2 text-xs font-medium tracking-[0.18em] text-stone-500">
                매출을 가볍게 확인해요
              </p>
            </div>
          </div>
        </header>

        {(message || error) && (
          <div
            className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${
              error ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {error ?? message}
          </div>
        )}

        <main className="flex-1 pb-6">
          {activeTab === "home" && <HomePage data={data} onMoveToSettings={() => setActiveTab("settings")} />}

          {activeTab === "input" && (
            <SalesInputPage
              data={data}
              onSaveSale={async (dateKey, amount, memo) => {
                try {
                  await saveSaleToApi(dateKey, amount, memo);
                  setData((prev) => ({
                    ...prev,
                    sales: {
                      ...prev.sales,
                      [dateKey]: {
                        amount,
                        memo,
                      },
                    },
                  }));
                  setMessage("일 매출이 Google Sheets에 저장됐어요.");
                  setError(null);
                } catch (saveError) {
                  console.error(saveError);
                  setError("일 매출 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
                }
              }}
            />
          )}

          {activeTab === "closed" && (
            <ClosedDaysPage
              data={data}
              monthKey={selectedMonth}
              onChangeMonth={setSelectedMonth}
              monthOptions={monthOptions}
              onToggleExtraClosedDay={async (monthKey, dateKey) => {
                try {
                  const current = new Set(data.extraClosedDays[monthKey] ?? []);
                  const shouldRemove = current.has(dateKey);
                  await saveClosedDayToApi(dateKey, shouldRemove ? "remove" : "extra");

                  setData((prev) => {
                    const nextSet = new Set(prev.extraClosedDays[monthKey] ?? []);
                    if (nextSet.has(dateKey)) {
                      nextSet.delete(dateKey);
                    } else {
                      nextSet.add(dateKey);
                    }

                    return {
                      ...prev,
                      extraClosedDays: {
                        ...prev.extraClosedDays,
                        [monthKey]: Array.from(nextSet).sort(),
                      },
                    };
                  });

                  setMessage("휴무일이 Google Sheets에 반영됐어요.");
                  setError(null);
                } catch (saveError) {
                  console.error(saveError);
                  setError("휴무일 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
                }
              }}
            />
          )}

          {activeTab === "report" && (
            <ReportPage
              data={data}
              monthKey={selectedMonth}
              onChangeMonth={setSelectedMonth}
              monthOptions={monthOptions}
              year={selectedYear}
              onChangeYear={setSelectedYear}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage
              monthKey={selectedMonth}
              onChangeMonth={setSelectedMonth}
              monthOptions={settingsMonthOptions}
              onSaveGoal={async (monthKey, amount) => {
                try {
                  await saveGoalToApi(monthKey, amount);
                  setData((prev) => {
                    const nextGoals = { ...prev.monthlyGoals };

                    if (amount <= 0) {
                      delete nextGoals[monthKey];
                    } else {
                      nextGoals[monthKey] = amount;
                    }

                    return {
                      ...prev,
                      monthlyGoals: nextGoals,
                    };
                  });
                  setMessage("월 목표 매출이 Google Sheets에 저장됐어요.");
                  setError(null);
                } catch (saveError) {
                  console.error(saveError);
                  setError("월 목표 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
                }
              }}
            />
          )}
        </main>

        <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
}

export default App;
