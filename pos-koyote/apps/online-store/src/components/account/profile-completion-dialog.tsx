"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Link } from "@/navigation";

type ProfileCompletionDialogProps = {
  open: boolean;
  href: string;
  labels: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
};

export function ProfileCompletionDialog({ open, href, labels }: ProfileCompletionDialogProps) {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
            {labels.secondary}
          </Button>
          <Button asChild>
            <Link href={href}>{labels.primary}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
