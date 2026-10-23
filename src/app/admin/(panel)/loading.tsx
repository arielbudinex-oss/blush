export default function AdminPanelLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Memuat halaman admin">
      <div className="h-3 w-24 rounded-full bg-paper-3" />
      <div className="mt-3 h-9 w-56 rounded-[10px] bg-paper-3" />
      <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-paper-3" />
      <div className="mt-6 h-px bg-line" />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="h-32 rounded-card border border-line bg-paper-2" />
        <div className="h-32 rounded-card border border-line bg-paper-2" />
        <div className="h-32 rounded-card border border-line bg-paper-2" />
      </div>
    </div>
  );
}
