import clsx from "clsx";
import { SectionCard } from "../components/SectionCard";
import { HairSalesManagerData } from "../types/sales";
import { formatMonthLabel, listDatesInMonth, toDateKey } from "../utils/dateUtils";
import { countClosedDays, getDailyTarget, getMonthlyGoal, getWorkDays, isClosedDay } from "../utils/salesUtils";

interface ClosedDaysPageProps {
  data: HairSalesManagerData;
  monthKey: string;
  onChangeMonth: (monthKey: string) => void;
  monthOptions: string[];
  onToggleExtraClosedDay: (monthKey: string, dateKey: string) => void;
}

export function ClosedDaysPage({
  data,
  monthKey,
  onChangeMonth,
  monthOptions,
  onToggleExtraClosedDay,
}: ClosedDaysPageProps) {
  const extraClosedDays = new Set(data.extraClosedDays[monthKey] ?? []);
  const monthDates = listDatesInMonth(monthKey);
  const goal = getMonthlyGoal(data, monthKey);
  const workDays = getWorkDays(data, monthKey);
  const closedDays = countClosedDays(data, monthKey);
  const dailyTarget = getDailyTarget(data, monthKey);
  const leadingBlankDays = monthDates[0]?.getDay() ?? 0;

  return (
    <div className="space-y-4">
      <SectionCard title="휴무일 관리" description="화요일은 기본 휴무로 자동 반영됩니다.">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-600">월 선택</span>
          <select
            value={monthKey}
            onChange={(event) => onChangeMonth(event.target.value)}
            className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
          >
            {monthOptions.map((option) => (
              <option key={option} value={option}>
                {formatMonthLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
            <p className="text-xs text-stone-500">목표</p>
            <p className="mt-1 font-semibold text-ink">{goal.toLocaleString("ko-KR")}원</p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
            <p className="text-xs text-stone-500">휴무일</p>
            <p className="mt-1 font-semibold text-ink">{closedDays}일</p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
            <p className="text-xs text-stone-500">일 목표</p>
            <p className="mt-1 font-semibold text-ink">{dailyTarget.toLocaleString("ko-KR")}원</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={formatMonthLabel(monthKey)} description={`근무일 ${workDays}일 기준`}>
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="py-2 font-semibold text-stone-400">
              {day}
            </div>
          ))}

          {Array.from({ length: leadingBlankDays }, (_, index) => (
            <div key={`blank-${index}`} />
          ))}

          {monthDates.map((date) => {
            const dateKey = toDateKey(date);
            const isTuesday = date.getDay() === 2;
            const isExtra = extraClosedDays.has(dateKey);
            const closed = isClosedDay(data, dateKey);
            const saleExists = Boolean(data.sales[dateKey]);

            return (
              <button
                key={dateKey}
                type="button"
                disabled={isTuesday}
                onClick={() => onToggleExtraClosedDay(monthKey, dateKey)}
                className={clsx(
                  "aspect-square rounded-2xl border px-1 py-2 text-sm transition",
                  isTuesday && "border-stone-200 bg-stone-100 text-stone-400",
                  !isTuesday && !closed && "border-orange-100 bg-orange-50/50 text-ink",
                  isExtra && "border-rose-300 bg-rose text-rose-700",
                )}
              >
                <div className="font-semibold">{date.getDate()}</div>
                <div className="mt-1 text-[10px]">
                  {isTuesday ? "화 휴무" : isExtra ? "추가 휴무" : saleExists ? "매출 있음" : "근무"}
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
