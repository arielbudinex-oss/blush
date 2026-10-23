import AdminLinks from "@/components/AdminLinks";
import AdminPageHeader from "@/components/AdminPageHeader";

export const instant = false;
export const metadata = { title: "Tautan admin", robots: { index: false, follow: false } };

export default function AdminLinksPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Pantau"
        title="Tautan"
        description="Semua tautan yang diklik pengunjung dalam 24 jam terakhir, diurutkan dari yang paling sering."
      />
      <AdminLinks />
    </>
  );
}
