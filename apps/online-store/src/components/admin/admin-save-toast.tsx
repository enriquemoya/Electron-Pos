"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type AdminSaveToastProps = {
  status?: string;
  successMessage: string;
  errorMessage: string;
};

export function AdminSaveToast({ status, successMessage, errorMessage }: AdminSaveToastProps) {
  const lastStatus = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!status || status === lastStatus.current) {
      return;
    }
    lastStatus.current = status;
    if (status === "save-success") {
      toast.success(successMessage);
    }
    if (status === "save-error") {
      toast.error(errorMessage);
    }
  }, [status, successMessage, errorMessage]);

  return null;
}
