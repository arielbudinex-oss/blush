export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-[var(--space-md)] py-[var(--space-lg)]" aria-busy="true">
      <span className="sr-only">Memuat halaman</span>
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 lg:max-w-[772px]">
        <div className="h-6 w-24 animate-pulse rounded-full bg-paper-2" />
        <div className="h-4 w-40 animate-pulse rounded-full bg-paper-2" />
        <div className="mt-2 h-[52dvh] animate-pulse rounded-[20px] border border-line bg-paper-2" />
      </div>
    </div>
  );
}
