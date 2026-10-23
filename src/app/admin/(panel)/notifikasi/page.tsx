import AdminPush from "@/components/AdminPush";
import AdminPageHeader from "@/components/AdminPageHeader";

export const instant = false;
export const metadata = { title: "Notifikasi admin", robots: { index: false, follow: false } };

export default function AdminNotificationPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Pantau"
        title="Notifikasi"
        description="Kirim pengumuman atau promosi ke perangkat yang sudah mengizinkan notifikasi. Jangan kirim berulang tanpa alasan."
      />
      <AdminPush />
    </>
  );
}
