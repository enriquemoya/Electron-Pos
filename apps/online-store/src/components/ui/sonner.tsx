"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ className, ...props }: ToasterProps) {
  return (
    <Sonner
      className={cn("toaster group", className)}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-neutral-900 group-[.toaster]:text-neutral-50 group-[.toaster]:border-neutral-800",
          description: "group-[.toast]:text-neutral-400",
          actionButton: "group-[.toast]:bg-neutral-50 group-[.toast]:text-neutral-900",
          cancelButton: "group-[.toast]:bg-neutral-800 group-[.toast]:text-neutral-100"
        }
      }}
      {...props}
    />
  );
}
