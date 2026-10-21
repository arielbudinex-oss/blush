const JAKARTA_DAY = 86_400_000;

export function sameDay(a: string | Date, b: string | Date) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
  );
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
}

export function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (sameDay(date, now)) return "Hari ini";
  if (sameDay(date, new Date(now.getTime() - JAKARTA_DAY))) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long" });
}

export function formatStamp(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (sameDay(date, now)) return formatClock(iso);
  if (sameDay(date, new Date(now.getTime() - JAKARTA_DAY))) return "Kemarin";
  if (now.getTime() - date.getTime() < 6 * JAKARTA_DAY)
    return date.toLocaleDateString("id-ID", { weekday: "short" });
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "baru saja";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "kemarin";
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
