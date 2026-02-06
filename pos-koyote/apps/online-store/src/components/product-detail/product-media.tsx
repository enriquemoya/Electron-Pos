"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/product-image";

export type ProductMediaImage = {
  src: string;
  alt: string;
};

export function ProductMedia({
  images,
  fallbackAlt,
  className
}: {
  images: ProductMediaImage[];
  fallbackAlt: string;
  className?: string;
}) {
  const safeImages = useMemo(() => images.filter((img) => Boolean(img.src)), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  const active = safeImages[activeIndex] ?? safeImages[0];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-base-800">
        <ProductImage
          src={active?.src}
          alt={active?.alt ?? fallbackAlt}
          fallbackAlt={fallbackAlt}
          className="object-cover"
          priority
        />
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
                <ProductImage src={img.src} alt={img.alt} fallbackAlt={fallbackAlt} className="object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
