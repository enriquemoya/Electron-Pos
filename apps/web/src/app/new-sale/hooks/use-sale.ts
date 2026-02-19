"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Customer,
  InventoryState,
  Money,
  PaymentMethod,
  PaymentValidationResult,
  Product,
  Sale,
  Shift
} from "@pos/core";
import {
  addItemToSale,
  createSaleItem,
  createEmptySale,
  deriveProofStatus,
  removeItemFromSale,
  updateItemQuantityInSale
} from "@pos/core";
import { createInventoryState } from "@pos/core";
import { t } from "../i18n";

type FocusArea = "search" | "cart";

type SaleState = {
  sale: Sale;
  products: Product[];
  topProducts: Product[];
  inventory: InventoryState;
  search: string;
  error: string | null;
  focus: FocusArea;
  activeShiftId: string | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string;
  proofFile: File | null;
  customerQuery: string;
  customerResults: Customer[];
  selectedCustomer: Customer | null;
  customerBalance: Money | null;
};

type UseSaleResult = {
  state: SaleState;
  filteredProducts: Product[];
  displayProducts: Product[];
  addProduct: (product: Product) => void;
  removeItem: (productId: string) => void;
  changeQuantity: (productId: string, quantity: number) => void;
  confirmSale: () => Promise<void>;
  updateSearch: (value: string) => void;
  setFocus: (focus: FocusArea) => void;
  clearSale: () => void;
  refreshInventory: () => Promise<void>;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setPaymentReference: (value: string) => void;
  setProofFile: (file: File | null) => void;
  setCustomerQuery: (value: string) => void;
  selectCustomer: (customer: Customer | null) => Promise<void>;
  confirmDisabled: boolean;
  confirmDisabledReason: string | null;
};

function createNewSale(shiftId: string): Sale {
  return createEmptySale(crypto.randomUUID(), shiftId, new Date().toISOString());
}

export function useSale(): UseSaleResult {
  const [state, setState] = useState<SaleState>({
    sale: createNewSale(""),
    products: [],
    topProducts: [],
    inventory: createInventoryState(),
    search: "",
    error: null,
    focus: "search",
    activeShiftId: null,
    paymentMethod: "EFECTIVO",
    paymentReference: "",
    proofFile: null,
    customerQuery: "",
    customerResults: [],
    selectedCustomer: null,
    customerBalance: null
  });

  useEffect(() => {
    const load = async () => {
      try {
        const products = await window.api?.products.getProducts();
        const inventory = await window.api?.inventory.getInventory();
        const activeShift = await window.api?.cashRegister.getActiveShift();
        setState((current) => ({
          ...current,
          products: products ?? [],
          topProducts: [],
          inventory: inventory ?? createInventoryState(),
          activeShiftId: activeShift?.id ?? null,
          sale: createNewSale(activeShift?.id ?? ""),
          error: activeShift ? null : t("errorNoShift")
        }));
      } catch {
        setState((current) => ({ ...current, error: t("errorLoadProducts") }));
      }
    };
    load();
  }, []);

  useEffect(() => {
    return undefined;
  }, []);

  useEffect(() => {
    const loadTop = async () => {
      if (state.search.trim().length > 0) {
        return;
      }
      const api = window.api?.products;
      if (!api) {
        return;
      }
      const top = await api.getTopProducts(5);
      if (top && top.length > 0) {
        setState((current) => ({ ...current, topProducts: top }));
        return;
      }
      const recent = await api.getRecentProducts(5);
      setState((current) => ({ ...current, topProducts: recent ?? [] }));
    };
    loadTop();
  }, [state.search]);

  useEffect(() => {
    const loadCustomers = async () => {
      if (state.paymentMethod !== "CREDITO_TIENDA") {
        return;
      }
      if (state.customerQuery.trim().length < 5) {
        setState((current) => ({ ...current, customerResults: [] }));
        return;
      }
      const api = window.api;
      if (!api) {
        return;
      }
      const results = await api.customers.searchCustomers(state.customerQuery);
      setState((current) => ({ ...current, customerResults: results ?? [] }));
    };
    loadCustomers();
  }, [state.paymentMethod, state.customerQuery]);

  const filteredProducts = useMemo(() => {
    const query = state.search.trim().toLowerCase();
    if (!query) {
      return state.products;
    }
    return state.products.filter((product) => product.name.toLowerCase().includes(query));
  }, [state.products, state.search]);

  const displayProducts = useMemo(() => {
    const query = state.search.trim();
    if (!query) {
      return state.topProducts;
    }
    return filteredProducts;
  }, [filteredProducts, state.search, state.topProducts]);

  const updateSearch = useCallback((value: string) => {
    setState((current) => ({ ...current, search: value }));
  }, []);

  const addProduct = useCallback((product: Product) => {
    const item = createSaleItem(product.id, product.name, product.price, 1);
    setState((current) => ({
      ...current,
      sale: addItemToSale(current.sale, item),
      error: null,
      focus: "cart"
    }));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setState((current) => ({
      ...current,
      sale: removeItemFromSale(current.sale, productId)
    }));
  }, []);

  const changeQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setState((current) => ({
        ...current,
        sale: removeItemFromSale(current.sale, productId)
      }));
      return;
    }
    setState((current) => ({
      ...current,
      sale: updateItemQuantityInSale(current.sale, productId, quantity)
    }));
  }, []);

  const refreshInventory = useCallback(async () => {
    const inventory = await window.api?.inventory.getInventory();
    if (!inventory) {
      return;
    }
    setState((current) => ({ ...current, inventory }));
  }, []);

  const confirmSale = useCallback(async () => {
    if (!state.activeShiftId) {
      setState((current) => ({ ...current, error: t("errorNoShift") }));
      return;
    }
    if (state.sale.items.length === 0) {
      setState((current) => ({ ...current, error: t("errorEmptySale") }));
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    const paymentAmount = state.sale.total.amount;
    const paymentValidation = await api.payments.validatePayment({
      method: state.paymentMethod,
      amount: paymentAmount,
      proofProvided: Boolean(state.proofFile)
    });
    if (!paymentValidation.valid) {
      if (paymentValidation.errors.includes("PAYMENT_METHOD_REQUIRED")) {
        setState((current) => ({ ...current, error: t("errorPaymentMethod") }));
        return;
      }
      if (paymentValidation.errors.includes("PAYMENT_AMOUNT_INVALID")) {
        setState((current) => ({ ...current, error: t("errorPaymentAmount") }));
        return;
      }
    }

    if (paymentAmount !== state.sale.total.amount) {
      setState((current) => ({ ...current, error: t("errorPaymentAmount") }));
      return;
    }

    if (state.paymentMethod === "CREDITO_TIENDA") {
      if (!state.selectedCustomer) {
        setState((current) => ({ ...current, error: t("errorCustomerRequired") }));
        return;
      }
      const balance = await api.storeCredit.getBalance(state.selectedCustomer.id);
      if (balance.amount < paymentAmount) {
        setState((current) => ({ ...current, error: t("errorInsufficientCredit") }));
        return;
      }
    }

    let proofFileRef: string | null = null;
    let warningMessage: string | null = null;
    let proofUploaded = false;
    if (paymentValidation.proofRequired && state.proofFile && state.paymentMethod) {
      const mimeType = state.proofFile.type || "application/octet-stream";
      const isAllowed = mimeType.startsWith("image/") || mimeType === "application/pdf";
      if (!isAllowed) {
        setState((current) => ({ ...current, error: t("errorPaymentProofType") }));
        return;
      }
      try {
        const buffer = await state.proofFile.arrayBuffer();
        const uploaded = await api.payments.attachProofAndUpload({
          fileBuffer: buffer,
          fileName: state.proofFile.name,
          mimeType,
          ticketNumber: state.sale.id,
          method: state.paymentMethod
        });
        proofFileRef = uploaded.proofFileRef;
        proofUploaded = true;
      } catch {
        warningMessage = t("warningProofPending");
      }
    } else if (paymentValidation.proofRequired) {
      warningMessage = t("warningProofPending");
    }

    try {
      const sale: Sale = {
        ...state.sale,
        shiftId: state.activeShiftId,
        customerId: state.selectedCustomer?.id ?? null,
        paymentMethod: state.paymentMethod ?? "EFECTIVO",
        paymentAmount: { amount: paymentAmount, currency: "MXN" },
        paymentReference: state.paymentReference || null,
        proofFileRef,
        proofStatus: deriveProofStatus(state.paymentMethod ?? "EFECTIVO", proofUploaded)
      };
      await api.sales.createSale(sale);
      setState((current) => ({
        ...current,
        sale: createNewSale(current.activeShiftId ?? ""),
        error: warningMessage ?? null,
        focus: "search",
        selectedCustomer: null,
        customerBalance: null,
        customerQuery: "",
        customerResults: []
      }));
      await refreshInventory();
    } catch {
      setState((current) => ({ ...current, error: t("errorSaveSale") }));
    }
  }, [
    state.sale,
    state.products,
    state.activeShiftId,
    state.paymentMethod,
    state.paymentReference,
    state.proofFile,
    state.selectedCustomer,
    refreshInventory
  ]);

  const clearSale = useCallback(() => {
    setState((current) => ({
      ...current,
      sale: createNewSale(current.activeShiftId ?? ""),
      search: "",
      error: null,
      paymentMethod: "EFECTIVO",
      paymentReference: "",
      proofFile: null,
      selectedCustomer: null,
      customerBalance: null,
      customerQuery: "",
      customerResults: []
    }));
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        clearSale();
      }
      if (event.key === "Enter" && state.focus === "cart") {
        if (state.sale.items.length === 0) {
          return;
        }
        if (state.paymentMethod === "CREDITO_TIENDA") {
          const balance = state.customerBalance?.amount ?? 0;
          if (!state.selectedCustomer || balance < state.sale.total.amount) {
            return;
          }
        }
        event.preventDefault();
        confirmSale();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    clearSale,
    confirmSale,
    state.focus,
    state.sale.items.length,
    state.sale.total.amount,
    state.paymentMethod,
    state.selectedCustomer,
    state.customerBalance
  ]);

  const cartEmpty = state.sale.items.length === 0;
  const isStoreCredit = state.paymentMethod === "CREDITO_TIENDA";
  const totalAmount = state.sale.total.amount;
  const balanceAmount = state.customerBalance?.amount ?? null;
  let confirmDisabledReason: string | null = null;
  if (isStoreCredit && !state.selectedCustomer) {
    confirmDisabledReason = t("errorCustomerRequired");
  } else if (isStoreCredit && balanceAmount !== null && balanceAmount < totalAmount) {
    confirmDisabledReason = t("errorInsufficientCredit");
  }

  return {
    state,
    filteredProducts,
    displayProducts,
    addProduct,
    removeItem,
    changeQuantity,
    confirmSale,
    updateSearch,
    setFocus: (focus) => setState((current) => ({ ...current, focus })),
    clearSale,
    refreshInventory,
    setPaymentMethod: (method) =>
      setState((current) => ({
        ...current,
        paymentMethod: method,
        selectedCustomer: method === "CREDITO_TIENDA" ? current.selectedCustomer : null,
        customerBalance: method === "CREDITO_TIENDA" ? current.customerBalance : null,
        customerResults: method === "CREDITO_TIENDA" ? current.customerResults : [],
        customerQuery: method === "CREDITO_TIENDA" ? current.customerQuery : ""
      })),
    setPaymentReference: (value) =>
      setState((current) => ({ ...current, paymentReference: value })),
    setProofFile: (file) => setState((current) => ({ ...current, proofFile: file })),
    setCustomerQuery: (value) => setState((current) => ({ ...current, customerQuery: value })),
    selectCustomer: async (customer) => {
      if (!customer) {
        setState((current) => ({
          ...current,
          selectedCustomer: null,
          customerBalance: null
        }));
        return;
      }
      const balance = await window.api?.storeCredit.getBalance(customer.id);
      setState((current) => ({
        ...current,
        selectedCustomer: customer,
        customerBalance: balance ?? null
      }));
    },
    confirmDisabled: cartEmpty || Boolean(confirmDisabledReason),
    confirmDisabledReason
  };
}
