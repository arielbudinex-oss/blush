export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blush-deep">{eyebrow}</p>
        <h1 className="mt-1 font-display text-[2rem] font-bold leading-tight tracking-[-0.03em] text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-left text-sm leading-6 text-ink-soft">{description}</p> : null}
      </div>
      {children}
    </header>
  );
}
