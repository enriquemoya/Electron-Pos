import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoginForm } from "@/components/auth/login-form";

async function requestMagicLink(prev: { ok: boolean; error?: string }, formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");
  if (!email) {
    return { ok: false, error: "missing" };
  }

  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    return { ok: false, error: "server" };
  }

  const response = await fetch(`${baseUrl}/auth/magic-link/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, locale }),
    cache: "no-store"
  });

  if (!response.ok) {
    const error = response.status === 400 ? "invalid" : "server";
    return { ok: false, error };
  }

  return { ok: true };
}

export default async function LoginPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: { error?: string };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  const initialError = searchParams?.error === "invalid" || searchParams?.error === "server" ? searchParams.error : undefined;

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t("login.title")}</h1>
        <p className="text-sm text-white/60">{t("login.subtitle")}</p>
      </div>
      <LoginForm
        locale={params.locale}
        initialError={initialError}
        action={requestMagicLink}
        labels={{
          emailLabel: t("login.emailLabel"),
          emailPlaceholder: t("login.emailPlaceholder"),
          submit: t("login.submit"),
          success: t("login.success"),
          errorInvalid: t("login.errorInvalid"),
          errorServer: t("login.errorServer")
        }}
      />
    </div>
  );
}
