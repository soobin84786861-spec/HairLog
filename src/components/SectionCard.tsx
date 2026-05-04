import { PropsWithChildren } from "react";
import clsx from "clsx";

interface SectionCardProps extends PropsWithChildren {
  title?: string;
  description?: string;
  className?: string;
}

export function SectionCard({ title, description, className, children }: SectionCardProps) {
  return (
    <section className={clsx("rounded-[28px] bg-white/95 p-5 shadow-soft", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
          {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
