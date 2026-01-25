import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";

type CTAButtonProps = {
  href: string;
  label: string;
  variant?: "default" | "outline";
  children?: ReactNode;
};

export function CTAButton({ href, label, variant = "default", children }: CTAButtonProps) {
  return (
    <Button asChild variant={variant}>
      <Link href={href}>
        {label}
        {children}
      </Link>
    </Button>
  );
}
