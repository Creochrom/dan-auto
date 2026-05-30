import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function JobCockpitSection({
  title,
  description,
  children,
  className = "",
}: Props) {
  return (
    <section className={`premium-card rounded-2xl p-4 sm:p-5 ${className}`.trim()}>
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
