import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import jwt from "jsonwebtoken";

import { AuthLoginPanel } from "@/components/auth/auth-login-panel";

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

async function passwordLogin(prev: { ok: boolean; error?: string }, formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const locale = String(formData.get("locale") ?? "es");
  if (!email || !password) {
    return { ok: false, error: "missing" };
  }

  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    return { ok: false, error: "server" };
  }

  const response = await fetch(`${baseUrl}/auth/password/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });

  if (!response.ok) {
    const error = response.status === 401 ? "invalid" : "server";
    return { ok: false, error };
  }

  const data = (await response.json()) as { accessToken: string; refreshToken: string };
  const cookieStore = cookies();
  cookieStore.set("auth_access", data.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60
  });
  cookieStore.set("auth_refresh", data.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60
  });

  let redirectPath = `/${locale}`;
  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      const payload = jwt.verify(data.accessToken, secret) as { role?: string };
      if (payload.role === "ADMIN") {
        redirectPath = `/${locale}/admin/home`;
      } else if (payload.role === "EMPLOYEE") {
        redirectPath = `/${locale}/admin/orders`;
      }
    } catch {
      // ignore and fall back to default redirect
    }
  }

  redirect(redirectPath);
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
        <p className="mt-2 text-sm text-white/60">{t("login.magicLinkHint")}</p>
      </div>
      <AuthLoginPanel
        locale={params.locale}
        initialError={initialError}
        magicLinkAction={requestMagicLink}
        passwordAction={passwordLogin}
        labels={{
          magic: {
            emailLabel: t("login.emailLabel"),
            emailPlaceholder: t("login.emailPlaceholder"),
            submit: t("login.submit"),
            success: t("login.success"),
            errorInvalid: t("login.errorInvalid"),
            errorServer: t("login.errorServer")
          },
          password: {
            emailLabel: t("password.emailLabel"),
            emailPlaceholder: t("password.emailPlaceholder"),
            passwordLabel: t("password.passwordLabel"),
            passwordPlaceholder: t("password.passwordPlaceholder"),
            submit: t("password.submit"),
            errorInvalid: t("password.errorInvalid"),
            errorServer: t("password.errorServer")
          },
          toggleToPassword: t("password.toggleToPassword"),
          toggleToMagic: t("password.toggleToMagic"),
          passwordHint: t("password.hint")
        }}
      />
    </div>
  );
}
