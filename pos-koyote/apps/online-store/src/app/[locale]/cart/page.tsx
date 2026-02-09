import { setRequestLocale } from "next-intl/server";

import { CartPage } from "@/components/cart/cart-page";

export default function CartRoute({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return <CartPage />;
}
