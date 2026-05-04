interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-orange-200 bg-orange-50/70 p-5 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}
