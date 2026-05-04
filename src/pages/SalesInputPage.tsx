import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { SectionCard } from "../components/SectionCard";
import { HairSalesManagerData } from "../types/sales";
import { formatDayLabel, getTodayMonthKey, toDateKey } from "../utils/dateUtils";
import { formatCurrency, getDailyTarget, getMonthKeyFromDateKey, isClosedDay } from "../utils/salesUtils";

interface SalesInputPageProps {
  data: HairSalesManagerData;
  onSaveSale: (dateKey: string, amount: number, memo: string) => void;
}

export function SalesInputPage({ data, onSaveSale }: SalesInputPageProps) {
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [amountInput, setAmountInput] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const sale = data.sales[dateKey];
    setAmountInput(sale?.amount ? String(sale.amount) : "");
    setMemo(sale?.memo ?? "");
  }, [data.sales, dateKey]);

  const monthKey = getMonthKeyFromDateKey(dateKey);
  const isClosed = isClosedDay(data, dateKey);
  const dailyTarget = isClosed ? 0 : getDailyTarget(data, monthKey);
  const savedSale = data.sales[dateKey]?.amount ?? 0;
  const difference = savedSale - dailyTarget;

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/[^\d]/g, "");
    setAmountInput(digitsOnly);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(amountInput);
    onSaveSale(dateKey, Number.isFinite(amount) ? amount : 0, memo.trim());
  };

  const isEditing = Boolean(data.sales[dateKey]);

  return (
    <div className="space-y-4">
      <SectionCard title="일 매출 입력" description="같은 날짜는 저장 시 자동으로 수정됩니다.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-600">날짜</span>
            <input
              type="date"
              value={dateKey}
              onChange={(event) => setDateKey(event.target.value)}
              className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none ring-0"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-600">매출 금액</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="예: 230000"
              value={amountInput}
              onChange={handleAmountChange}
              className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none ring-0"
            />
            <p className="mt-2 text-sm text-stone-500">
              입력값 미리보기: {amountInput ? formatCurrency(Number(amountInput)) : "0원"}
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-600">메모</span>
            <textarea
              rows={4}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="선택 사항"
              className="w-full resize-none rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none ring-0"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-brand-500 px-4 py-3 text-base font-semibold text-white"
          >
            {isEditing ? "매출 수정하기" : "매출 저장하기"}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="선택한 날짜 요약" description={formatDayLabel(dateKey)}>
        {getTodayMonthKey() !== monthKey && !data.monthlyGoals[monthKey] ? (
          <EmptyState
            title="이 달의 목표 매출이 아직 없어요"
            description="설정 탭에서 해당 월 목표를 먼저 입력하면 비교 지표가 더 정확해집니다."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="text-sm text-stone-500">일 목표 매출</p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {isClosed ? "휴무일" : formatCurrency(dailyTarget)}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="text-sm text-stone-500">현재 저장된 매출</p>
              <p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(savedSale)}</p>
              {!isClosed && (
                <p className={`mt-1 text-sm ${difference >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {difference >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(difference))}
                </p>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
