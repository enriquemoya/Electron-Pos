"use client";

import { useMemo } from "react";
import { CartItem } from "./components/cart-item";
import { CartSummary } from "./components/cart-summary";
import { ProductList } from "./components/product-list";
import { ProductSearch } from "./components/product-search";
import { PaymentPanel } from "./components/payment-panel";
import { SaleActions } from "./components/sale-actions";
import { useSale } from "./hooks/use-sale";
import { t } from "./i18n";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount / 100);
}

export default function NewSalePage() {
  const {
    state,
    filteredProducts,
    displayProducts,
    addProduct,
    removeItem,
    changeQuantity,
    confirmSale,
    updateSearch,
    setFocus,
    clearSale,
    setPaymentMethod,
    setPaymentReference,
    setProofFile,
    setCustomerQuery,
    selectCustomer,
    confirmDisabled,
    confirmDisabledReason
  } = useSale();

  const total = useMemo(() => formatMoney(state.sale.total.amount), [state.sale.total.amount]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="flex flex-col gap-4">
          <ProductSearch
            value={state.search}
            onChange={updateSearch}
            onSubmitFirst={() => {
              const first = displayProducts[0];
              if (first) {
                addProduct(first);
              }
            }}
            onFocus={() => setFocus("search")}
          />
          <ProductList
            products={displayProducts}
            inventory={state.inventory}
            onSelect={addProduct}
            formatMoney={formatMoney}
          />
        </section>

        <section
          className="flex h-[calc(100vh-220px)] flex-col gap-4 overflow-hidden"
          onClick={() => setFocus("cart")}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{t("cartTitle")}</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {state.sale.items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-base-900 p-4 text-sm text-zinc-400">
                {t("cartEmpty")}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {state.sale.items.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    onIncrease={() => changeQuantity(item.productId, item.quantity + 1)}
                    onDecrease={() => changeQuantity(item.productId, item.quantity - 1)}
                    onRemove={() => removeItem(item.productId)}
                    formatMoney={formatMoney}
                  />
                ))}
              </div>
            )}
          </div>
          <CartSummary total={total} />
          <PaymentPanel
            method={state.paymentMethod}
            reference={state.paymentReference}
            proofFile={state.proofFile}
            customerQuery={state.customerQuery}
            customerResults={state.customerResults}
            selectedCustomer={state.selectedCustomer}
            customerBalance={state.customerBalance?.amount ?? null}
            onMethodChange={setPaymentMethod}
            onReferenceChange={setPaymentReference}
            onProofChange={setProofFile}
            onCustomerQueryChange={setCustomerQuery}
            onCustomerSelect={(customerId) => {
              const customer = state.customerResults.find((entry) => entry.id === customerId) ?? null;
              selectCustomer(customer);
            }}
            formatMoney={formatMoney}
          />
          <SaleActions
            onConfirm={confirmSale}
            onClear={clearSale}
            error={state.error}
            confirmDisabled={confirmDisabled}
            confirmDisabledReason={confirmDisabledReason}
          />
        </section>
      </div>
    </div>
  );
}
