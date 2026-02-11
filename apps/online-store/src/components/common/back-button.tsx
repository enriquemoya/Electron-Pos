"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type BackButtonProps = {
  label: string;
  fallbackHref: string;
  className?: string;
};

export function BackButton({ label, fallbackHref, className }: BackButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }, [fallbackHref, router]);

  return (
    <Button type="button" variant="ghost" className={className} onClick={handleClick}>
      {label}
    </Button>
  );
}
