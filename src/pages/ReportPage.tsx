import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "../components/EmptyState";
import { SectionCard } from "../components/SectionCard";
import { HairSalesManagerData } from "../types/sales";
import { createYearOptions, formatMonthLabel } from "../utils/dateUtils";
import {
  buildCumulativeChart,
  buildDailySalesChart,
  buildYearlyReport,
  formatCurrency,
  formatPercent,
  getMonthlySummary,
  getYearTotals,
} from "../utils/salesUtils";

interface ReportPageProps {
  data: HairSalesManagerData;
  monthKey: string;
  onChangeMonth: (monthKey: string) => void;
  monthOptions: string[];
  year: number;
  onChangeYear: (year: number) => void;
}

export function ReportPage({
  data,
  monthKey,
  onChangeMonth,
  monthOptions,
  year,
  onChangeYear,
}: ReportPageProps) {
  const monthlySummary = getMonthlySummary(data, monthKey);
  const dailyChart = buildDailySalesChart(data, monthKey);
  const cumulativeChart = buildCumulativeChart(data, monthKey);
  const yearlyReport = buildYearlyReport(data, year);
  const yearlyTotals = getYearTotals(data, year);
  const yearOptions = createYearOptions(year);

  return (
    <div className="space-y-4">
      <SectionCard title="월간 리포트" description="일자별 매출과 목표선을 함께 확인할 수 있어요.">
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

        {monthlySummary.goal === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="이 달의 목표 매출이 없습니다"
              description="설정 탭에서 목표 매출을 입력하면 그래프와 달성률이 자동 계산됩니다."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-sm text-stone-500">월 누적 매출</p>
                <p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(monthlySummary.totalSales)}</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-sm text-stone-500">월 달성률</p>
                <p className="mt-2 text-xl font-semibold text-ink">
                  {formatPercent(monthlySummary.achievementRate)}
                </p>
              </div>
            </div>

            <div className="h-72 rounded-[24px] border border-orange-100 bg-white p-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyChart}>
                  <CartesianGrid stroke="#f3e8dd" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}만`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar name="일 매출" dataKey="amount" radius={[8, 8, 0, 0]}>
                    {dailyChart.map((entry) => (
                      <Cell key={entry.dateKey} fill={entry.closed ? "#d6d3d1" : "#f97316"} />
                    ))}
                  </Bar>
                  <Line
                    name="일 목표"
                    type="monotone"
                    dataKey="target"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="h-72 rounded-[24px] border border-orange-100 bg-white p-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cumulativeChart}>
                  <CartesianGrid stroke="#f3e8dd" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}만`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line
                    name="누적 매출"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#ea580c"
                    strokeWidth={3}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="연간 리포트" description="월별 누적 흐름과 목표 대비 달성률입니다.">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-600">연도 선택</span>
          <select
            value={year}
            onChange={(event) => onChangeYear(Number(event.target.value))}
            className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none"
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}년
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="text-sm text-stone-500">연간 누적 매출</p>
            <p className="mt-2 text-xl font-semibold text-ink">{formatCurrency(yearlyTotals.totalSales)}</p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="text-sm text-stone-500">연간 달성률</p>
            <p className="mt-2 text-xl font-semibold text-ink">{formatPercent(yearlyTotals.achievementRate)}</p>
          </div>
        </div>

        <div className="mt-4 h-72 rounded-[24px] border border-orange-100 bg-white p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyReport}>
              <CartesianGrid stroke="#f3e8dd" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `${Math.round(value / 10000)}만`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar name="월 매출" dataKey="sales" fill="#f97316" radius={[8, 8, 0, 0]} />
              <Bar name="월 목표" dataKey="goal" fill="#fed7aa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 h-72 rounded-[24px] border border-orange-100 bg-white p-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yearlyReport}>
              <CartesianGrid stroke="#f3e8dd" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 150]} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Line
                name="달성률"
                type="monotone"
                dataKey="achievementRate"
                stroke="#0f766e"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
