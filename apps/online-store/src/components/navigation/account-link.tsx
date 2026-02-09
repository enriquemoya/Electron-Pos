import { UserRound } from "lucide-react";

import { Link } from "@/navigation";

type AccountLinkProps = {
  href: string;
  label: string;
};

export function AccountLink({ href, label }: AccountLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/70 transition hover:text-white"
      aria-label={label}
      title={label}
    >
      <UserRound className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </Link>
  );
}
