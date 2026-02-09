import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query: Record<string, string | number | undefined>;
  labels: {
    label: string;
    prev: string;
    next: string;
  };
};

function buildHref(basePath: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ page, pageSize, total, basePath, query, labels }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="flex items-center justify-between text-sm text-white/60">
      <span>{labels.label}</span>
      <div className="flex gap-2">
        <Button asChild variant="ghost" size="sm" disabled={page === 1}>
          <Link href={buildHref(basePath, { ...query, page: prevPage })}>{labels.prev}</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" disabled={page === totalPages}>
          <Link href={buildHref(basePath, { ...query, page: nextPage })}>{labels.next}</Link>
        </Button>
      </div>
    </div>
  );
}
