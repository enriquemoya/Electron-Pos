import * as React from "react";

import { cn } from "@/lib/utils";

const Accordion = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-3", className)} {...props} />
);

const AccordionItem = React.forwardRef<HTMLDetailsElement, React.HTMLAttributes<HTMLDetailsElement>>(
  ({ className, ...props }, ref) => (
    <details
      ref={ref}
      className={cn("rounded-2xl border border-white/10 bg-base-800/60", className)}
      {...props}
    />
  )
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <summary
      ref={ref}
      className={cn(
        "cursor-pointer list-none px-6 py-4 text-base font-semibold text-white transition-colors hover:text-white/80",
        className
      )}
      {...props}
    />
  )
);
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 pb-5 text-sm text-white/70", className)} {...props} />
  )
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
