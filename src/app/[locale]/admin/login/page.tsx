import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminAuthenticated } from "@/lib/auth";
import { go } from "@/lib/redirect";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await isAdminAuthenticated()) {
    go("/admin", locale);
  }
  const t = await getTranslations("admin");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-4xl">{t("loginTitle")}</h1>
      <div className="mt-6">
        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
