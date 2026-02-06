"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export type ProductMediaImage = {
  src: string;
  alt: string;
};

export function ProductMedia({
  images,
  className
}: {
  images: ProductMediaImage[];
  className?: string;
}) {
  const safeImages = useMemo(() => images.filter((img) => Boolean(img.src)), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  const active = safeImages[activeIndex] ?? safeImages[0];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-base-800">
        {active ? <Image src={active.src} alt={active.alt} fill className="object-cover" priority /> : null}
      </div>

      {safeImages.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {safeImages.map((img, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${img.src}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-16 flex-none overflow-hidden rounded-xl border bg-base-800",
                  isActive ? "border-accent-500 ring-2 ring-accent-500/30" : "border-white/10 hover:border-white/20"
                )}
                aria-label={img.alt}
              >
                <Image src={img.src} alt={img.alt} fill className="object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
