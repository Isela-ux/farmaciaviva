import type { ReactNode } from "react";

export function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-forest/10 bg-card-white p-5 shadow-sm ${className}`}
    >
      <h2 className="mb-3 text-lg font-semibold text-forest">{title}</h2>
      {children}
    </section>
  );
}
