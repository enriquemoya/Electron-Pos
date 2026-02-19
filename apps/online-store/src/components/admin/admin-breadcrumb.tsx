import { AppBreadcrumb, type AppBreadcrumbItem } from "@/components/common/app-breadcrumb";

export function AdminBreadcrumb({
  locale,
  homeLabel,
  adminLabel,
  items,
  className
}: {
  locale: string;
  homeLabel: string;
  adminLabel: string;
  items?: AppBreadcrumbItem[];
  className?: string;
}) {
  const breadcrumbItems: AppBreadcrumbItem[] = [
    { label: homeLabel, href: `/${locale}` },
    { label: adminLabel, href: `/${locale}/admin/home` },
    ...(items ?? [])
  ];

  return <AppBreadcrumb items={breadcrumbItems} className={className} />;
}
