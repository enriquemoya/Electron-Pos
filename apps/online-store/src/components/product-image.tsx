"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const PLACEHOLDER_SRC = "/assets/hero/product_placeholder.png";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  fallbackAlt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
};

export function ProductImage({
  src,
  alt,
  fallbackAlt,
  className,
  fill = true,
  priority = false,
  sizes
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const isExternal = typeof src === "string" && (/^https?:\/\//i.test(src) || src.startsWith("//"));
  const hasSrc = Boolean(src);
  const resolvedSrc = !hasSrc || failed ? PLACEHOLDER_SRC : (src as string);
  const resolvedAlt = !hasSrc || failed ? fallbackAlt : alt;
  const resolvedSizes = useMemo(() => sizes ?? (fill ? "100vw" : undefined), [fill, sizes]);

  if (isExternal) {
    return (
      <img
        src={resolvedSrc}
        alt={resolvedAlt}
        loading={priority ? "eager" : "lazy"}
        className={cn("h-full w-full object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={resolvedAlt}
      fill={fill}
      sizes={resolvedSizes}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
