"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type OrderStatusToastProps = {
  success?: boolean;
  error?: boolean;
  successMessage: string;
  errorMessage: string;
};

export function OrderStatusToast({ success, error, successMessage, errorMessage }: OrderStatusToastProps) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = success ? "success" : error ? "error" : null;
    if (!key || key === lastKey.current) {
      return;
    }
    lastKey.current = key;
    if (success) {
      toast.success(successMessage);
    }
    if (error) {
      toast.error(errorMessage);
    }
  }, [error, success, successMessage, errorMessage]);

  return null;
}
