"use client";

import { LogOut, Package, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Link } from "@/navigation";

type AccountMenuProps = {
  profileHref: string;
  ordersHref: string;
  ordersLabel: string;
  profileLabel: string;
  logoutLabel: string;
  menuLabel: string;
  signInLabel: string;
  signInHref: string;
  logoutHref: string;
  isAuthenticated: boolean;
};

export function AccountMenu({
  profileHref,
  ordersHref,
  ordersLabel,
  profileLabel,
  logoutLabel,
  menuLabel,
  signInLabel,
  signInHref,
  logoutHref,
  isAuthenticated,
}: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full border border-white/10 p-2 text-white/70 transition hover:text-white"
          aria-label={menuLabel}
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isAuthenticated ? (
          <>
            <DropdownMenuItem asChild>
              <Link href={ordersHref} className="flex items-center gap-2">
                <Package className="h-4 w-4" aria-hidden="true" />
                <span>{ordersLabel}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={profileHref} className="flex items-center gap-2">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span>{profileLabel}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={logoutHref} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>{logoutLabel}</span>
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={signInHref} className="flex items-center gap-2">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span>{signInLabel}</span>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
