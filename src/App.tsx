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
    const loadInitialMonth = async () => {
      try {
        const monthData = await fetchMonthData(getTodayMonthKey());
        setData((prev) => replaceMonthSlice(prev, getTodayMonthKey(), monthData));
        setError(null);
      } catch (loadError) {
        console.error(loadError);
        setError("Google Sheets 데이터를 불러오지 못했어요. 환경변수와 시트 공유 설정을 확인해 주세요.");
      }
    };

    void loadInitialMonth();
  }, []);

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
  }, [selectedYear]);

  const monthOptions = useMemo(() => createMonthOptions(selectedMonth, 9), [selectedMonth]);

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
          <div className="inline-flex max-w-full flex-col items-center rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 text-center shadow-soft backdrop-blur">
            <div className="mt-3 flex items-end justify-center gap-2">
              <span className="mb-1 rounded-full bg-brand-100 px-2 py-1 text-[27px] font-bold tracking-[0.18em] text-brand-700">
                유빈 디자이너 목표 🐻
              </span>
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
                  setMessage("일 매출이 Google Sheets에 저장되었어요.");
                  setError(null);
                } catch (saveError) {
                  console.error(saveError);
                  setError("일 매출 저장에 실패했어요.");
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

                  setMessage("휴무일이 Google Sheets에 반영되었어요.");
                  setError(null);
                } catch (saveError) {
                  console.error(saveError);
                  setError("휴무일 저장에 실패했어요.");
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
              monthOptions={monthOptions}
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
                  setMessage("월 목표 매출이 Google Sheets에 저장되었어요.");
                  setError(null);
                } catch (saveError) {
                  console.error(saveError);
                  setError("월 목표 저장에 실패했어요.");
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
