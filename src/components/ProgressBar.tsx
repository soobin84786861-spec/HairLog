interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-orange-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-400 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
