"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function LogoutReload() {
  const searchParams = useSearchParams();
  const logout = searchParams.get("logout");

  useEffect(() => {
    if (logout !== "1") {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("logout");
    window.history.replaceState({}, "", url.toString());
    window.location.reload();
  }, [logout]);

  return null;
}
