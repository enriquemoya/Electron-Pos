import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { CheckoutPage } from "@/components/checkout/checkout-page";
import { fetchPickupBranches } from "@/lib/checkout-api";

export default async function CheckoutRoute({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);

  const token = cookies().get("auth_access")?.value;
  if (!token) {
    redirect(`/${params.locale}/auth/login`);
  }

  const branches = await fetchPickupBranches();

  return <CheckoutPage branches={branches} />;
}
