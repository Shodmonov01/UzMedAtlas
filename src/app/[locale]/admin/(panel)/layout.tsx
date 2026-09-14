import { isAdminAuthenticated } from "@/lib/auth";
import { go } from "@/lib/redirect";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(await isAdminAuthenticated())) {
    go("/admin/login", locale);
  }

  return (
    <div className="admin-shell bg-sand">
      <AdminNav locale={locale} />
      <div className="min-h-screen p-4 md:p-8">{children}</div>
    </div>
  );
}
