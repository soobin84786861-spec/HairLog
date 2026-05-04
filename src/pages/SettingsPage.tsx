import { useEffect, useState } from "react";
import { SectionCard } from "../components/SectionCard";
import { formatMonthLabel } from "../utils/dateUtils";

interface SettingsPageProps {
  monthKey: string;
  onChangeMonth: (monthKey: string) => void;
  monthOptions: string[];
  onSaveGoal: (monthKey: string, amount: number) => void;
}

export function SettingsPage({
  monthKey,
  onChangeMonth,
  monthOptions,
  onSaveGoal,
}: SettingsPageProps) {
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    setGoalInput("");
  }, [monthKey]);

  return (
    <div className="space-y-4">
      <SectionCard title="월 목표 매출 설정" description="월별로 별도 저장됩니다.">
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

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-stone-600">목표 금액</span>
          <input
            type="text"
            inputMode="numeric"
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value.replace(/[^\d]/g, ""))}
            placeholder="예: 5000000"
            className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
          />
        </label>

        <button
          type="button"
          onClick={() => onSaveGoal(monthKey, Number(goalInput || 0))}
          className="mt-4 w-full rounded-2xl bg-brand-500 px-4 py-3 text-base font-semibold text-white"
        >
          목표 매출 저장하기
        </button>
      </SectionCard>
    </div>
  );
}
