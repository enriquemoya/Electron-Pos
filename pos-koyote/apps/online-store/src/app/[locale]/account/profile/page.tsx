import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";
import { Card } from "@/components/ui/card";
import { fetchProfile } from "@/lib/profile-api";

type State = { ok: boolean; error?: string };

async function updateProfileAction(prev: State, formData: FormData): Promise<State> {
  "use server";
  const token = cookies().get("auth_access")?.value;
  if (!token) {
    return { ok: false, error: "server" };
  }

  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    return { ok: false, error: "server" };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const addressPayload = {
    street: String(formData.get("street") ?? "").trim(),
    externalNumber: String(formData.get("externalNumber") ?? "").trim(),
    internalNumber: String(formData.get("internalNumber") ?? "").trim(),
    postalCode: String(formData.get("postalCode") ?? "").trim(),
    neighborhood: String(formData.get("neighborhood") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
    references: String(formData.get("references") ?? "").trim()
  };

  const hasAddress = Object.values(addressPayload).some((value) => value.length > 0);

  const payload = {
    firstName,
    lastName,
    phone,
    ...(hasAddress ? { address: addressPayload } : {})
  };

  const response = await fetch(`${baseUrl}/profile/me`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "x-cloud-secret": process.env.CLOUD_SHARED_SECRET || "",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const error = response.status === 400 ? "invalid" : "server";
    return { ok: false, error };
  }

  return { ok: true };
}

async function updatePasswordAction(prev: State, formData: FormData): Promise<State> {
  "use server";
  const token = cookies().get("auth_access")?.value;
  if (!token) {
    return { ok: false, error: "server" };
  }

  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    return { ok: false, error: "server" };
  }

  const password = String(formData.get("password") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  const response = await fetch(`${baseUrl}/profile/password`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "x-cloud-secret": process.env.CLOUD_SHARED_SECRET || "",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ password, confirmPassword }),
    cache: "no-store"
  });

  if (!response.ok) {
    const error = response.status === 400 ? "invalid" : "server";
    return { ok: false, error };
  }

  return { ok: true };
}

export default async function ProfilePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);

  const token = cookies().get("auth_access")?.value;
  if (!token) {
    redirect(`/${params.locale}/auth/login`);
  }

  const t = await getTranslations({ locale: params.locale, namespace: "account" });
  const profile = await fetchProfile();

  const values = {
    firstName: profile?.user.firstName ?? "",
    lastName: profile?.user.lastName ?? "",
    phone: profile?.user.phone ?? "",
    address: {
      street: profile?.address?.street ?? "",
      externalNumber: profile?.address?.externalNumber ?? "",
      internalNumber: profile?.address?.internalNumber ?? "",
      postalCode: profile?.address?.postalCode ?? "",
      neighborhood: profile?.address?.neighborhood ?? "",
      city: profile?.address?.city ?? "",
      state: profile?.address?.state ?? "",
      country: profile?.address?.country ?? "",
      references: profile?.address?.references ?? ""
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">{t("profile.title")}</h1>
        <p className="text-sm text-white/60">{t("profile.subtitle")}</p>
      </div>

      <Card className="p-6">
        <ProfileForm
          action={updateProfileAction}
          values={values}
          labels={{
            title: t("profile.personal.title"),
            description: t("profile.personal.description"),
            firstName: t("profile.personal.firstName"),
            lastName: t("profile.personal.lastName"),
            phone: t("profile.personal.phone"),
            addressTitle: t("profile.address.title"),
            street: t("profile.address.street"),
            externalNumber: t("profile.address.externalNumber"),
            internalNumber: t("profile.address.internalNumber"),
            postalCode: t("profile.address.postalCode"),
            neighborhood: t("profile.address.neighborhood"),
            city: t("profile.address.city"),
            state: t("profile.address.state"),
            country: t("profile.address.country"),
            references: t("profile.address.references"),
            submit: t("profile.personal.submit"),
            success: t("profile.personal.success"),
            errorInvalid: t("profile.personal.errorInvalid"),
            errorServer: t("profile.personal.errorServer")
          }}
        />
      </Card>

      <Card className="p-6">
        <PasswordForm
          action={updatePasswordAction}
          labels={{
            title: t("profile.password.title"),
            description: t("profile.password.description"),
            password: t("profile.password.password"),
            confirmPassword: t("profile.password.confirm"),
            submit: t("profile.password.submit"),
            success: t("profile.password.success"),
            errorInvalid: t("profile.password.errorInvalid"),
            errorServer: t("profile.password.errorServer")
          }}
        />
      </Card>
    </div>
  );
}
