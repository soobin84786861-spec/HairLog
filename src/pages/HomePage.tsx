import { EmptyState } from "../components/EmptyState";
import { ProgressBar } from "../components/ProgressBar";
import { SectionCard } from "../components/SectionCard";
import { SummaryStatCard } from "../components/SummaryStatCard";
import { HairSalesManagerData } from "../types/sales";
import { formatDayLabel, getTodayMonthKey } from "../utils/dateUtils";
import {
  formatCurrency,
  formatPercent,
  getMonthlySummary,
  getRecentSales,
  getTodayMetrics,
} from "../utils/salesUtils";

interface HomePageProps {
  data: HairSalesManagerData;
  onMoveToSettings: () => void;
}

export function HomePage({ data, onMoveToSettings }: HomePageProps) {
  const monthKey = getTodayMonthKey();
  const summary = getMonthlySummary(data, monthKey);
  const today = getTodayMetrics(data);
  const recentSales = getRecentSales(data, 5);

  const differenceTone = today.difference > 0 ? "positive" : today.difference < 0 ? "negative" : "default";
  const differenceText =
    today.isClosed
      ? "휴무일"
      : today.difference > 0
        ? `+${formatCurrency(today.difference)} 초과 달성`
        : today.difference < 0
          ? `-${formatCurrency(Math.abs(today.difference))} 부족`
          : "목표와 동일";

  return (
    <div className="space-y-4">
      {summary.goal === 0 ? (
        <SectionCard>
          <EmptyState
            title="이번 달 목표 매출이 아직 없어요"
            description="설정 탭에서 이번 달 목표 금액을 입력하면 홈과 리포트가 바로 채워집니다."
          />
          <button
            type="button"
            onClick={onMoveToSettings}
            className="mt-4 w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
          >
            목표 매출 설정하러 가기
          </button>
        </SectionCard>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryStatCard label="이번 달 목표" value={formatCurrency(summary.goal)} />
            <SummaryStatCard label="이번 달 누적" value={formatCurrency(summary.totalSales)} />
            <SummaryStatCard
              label="달성률"
              value={formatPercent(summary.achievementRate)}
              hint={`남은 목표 ${formatCurrency(summary.remainingGoal)}`}
            />
            <SummaryStatCard
              label="오늘 목표"
              value={today.isClosed ? "휴무일" : formatCurrency(today.todayTarget)}
              hint={`근무일 ${summary.workDays}일`}
            />
          </section>

          <SectionCard title="이번 달 달성률" description="현재 누적 매출 기준 진행률입니다.">
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-semibold tracking-tight text-ink">
                  {formatPercent(summary.achievementRate)}
                </span>
                <span className="text-sm text-stone-500">남은 목표 {formatCurrency(summary.remainingGoal)}</span>
              </div>
              <ProgressBar value={summary.achievementRate} />
            </div>
          </SectionCard>
        </>
      )}

      <SectionCard title="오늘 비교" description={formatDayLabel(today.todayKey)}>
        <div className="grid grid-cols-2 gap-3">
          <SummaryStatCard label="오늘 입력 매출" value={formatCurrency(today.todaySale)} />
          <SummaryStatCard
            label="목표 대비 차이"
            value={differenceText}
            tone={differenceTone}
            hint={today.todayMemo ? `메모: ${today.todayMemo}` : undefined}
          />
        </div>
      </SectionCard>

      <SectionCard title="최근 입력" description="가장 최근에 저장한 매출입니다.">
        {recentSales.length === 0 ? (
          <EmptyState
            title="아직 입력된 매출이 없어요"
            description="입력 탭에서 날짜와 금액을 저장하면 최근 기록이 여기에 표시됩니다."
          />
        ) : (
          <ul className="space-y-3">
            {recentSales.map(([dateKey, sale]) => (
              <li key={dateKey} className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{formatDayLabel(dateKey)}</p>
                    {sale.memo && <p className="mt-1 text-sm text-stone-500">{sale.memo}</p>}
                  </div>
                  <p className="text-lg font-semibold tracking-tight text-ink">{formatCurrency(sale.amount)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
