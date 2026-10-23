import AdminLive from "@/components/AdminLive";
import AdminPageHeader from "@/components/AdminPageHeader";

export const instant = false;
export const metadata = { title: "Aktivitas admin", robots: { index: false, follow: false } };

export default function AdminActivityPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Pantau"
        title="Aktivitas"
        description="Pengunjung, sesi, klik tautan, dan perangkat yang aktif. IP hanya ditampilkan dalam bentuk tersamarkan."
      />
      <AdminLive />
    </>
  );
}
