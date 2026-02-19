import { Link } from "@/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

type AppBreadcrumbItem = {
  label: string;
  href?: string;
};

export function AppBreadcrumb({
  items,
  className
}: {
  items: AppBreadcrumbItem[];
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  const normalizeHref = (href: string) => {
    const localizedPath = href.match(/^\/(es|en)(\/.*)?$/);
    if (!localizedPath) {
      return href;
    }

    return localizedPath[2] ?? "/";
  };

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <BreadcrumbItem key={`${item.label}-${index}`}>
              {!isLast && item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={normalizeHref(item.href)}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
              {!isLast ? <BreadcrumbSeparator /> : null}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export type { AppBreadcrumbItem };
