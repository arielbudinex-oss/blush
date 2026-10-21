/** Kelas UI bersama. Semua warna lewat token di globals.css, tidak ada nilai mentah. */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-[999px] bg-blush-deep px-6 py-3 text-sm font-semibold text-paper transition-colors duration-200 ease-out hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-[999px] border border-line-strong px-5 py-3 text-sm font-semibold text-ink transition-colors duration-200 ease-out hover:border-ink hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-60";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-[999px] border border-blush-deep px-5 py-3 text-sm font-semibold text-blush-deep transition-colors duration-200 ease-out hover:bg-blush-tint";

export const inputBase =
  "w-full rounded-[8px] border border-line-input bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-blush-deep";

export const card = "rounded-card border border-line bg-paper p-[var(--space-md)]";

export const label = "block text-xs font-semibold text-ink-soft";

export function Shell({ children, title, hint }: { children: React.ReactNode; title: string; hint?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-[var(--space-md)] px-[var(--space-md)] py-[var(--space-2xl)]">
      <h1 className="text-3xl">{title}</h1>
      {hint ? <p className="text-sm text-ink-soft">{hint}</p> : null}
      {children}
    </main>
  );
}
