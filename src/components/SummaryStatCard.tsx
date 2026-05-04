import clsx from "clsx";

interface SummaryStatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative";
}

export function SummaryStatCard({ label, value, hint, tone = "default" }: SummaryStatCardProps) {
  return (
    <div
      className={clsx(
        "rounded-[24px] border p-4",
        tone === "positive" && "border-emerald-200 bg-mint",
        tone === "negative" && "border-rose-200 bg-rose",
        tone === "default" && "border-orange-100 bg-orange-50/60",
      )}
    >
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
