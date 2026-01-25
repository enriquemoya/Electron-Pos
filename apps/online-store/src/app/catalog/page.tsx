import { fetchCatalog } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CatalogPageProps = {
  searchParams: {
    page?: string;
    pageSize?: string;
    query?: string;
    gameTypeId?: string;
    expansionId?: string;
  };
};

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const page = parseNumber(searchParams.page, 1);
  const pageSize = parseNumber(searchParams.pageSize, 12);
  const query = searchParams.query ?? "";
  const gameTypeId = searchParams.gameTypeId ?? "";
  const expansionId = searchParams.expansionId ?? "";

  let data;
  try {
    data = await fetchCatalog({
      page,
      pageSize,
      query,
      gameTypeId,
      expansionId
    });
  } catch (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/70">
        Unable to load the catalog right now. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Catalog</h1>
          <p className="text-sm text-white/60">Explore the latest sealed products, singles, and accessories.</p>
        </div>
      </div>

      <form className="grid gap-3 rounded-xl border border-white/10 bg-base-800/60 p-4 md:grid-cols-4">
        <Input name="query" placeholder="Search by product name" defaultValue={query} />
        <Input name="gameTypeId" placeholder="Game type id (optional)" defaultValue={gameTypeId} />
        <Input name="expansionId" placeholder="Expansion id (optional)" defaultValue={expansionId} />
        <div className="flex gap-2">
          <Button type="submit" variant="outline" className="w-full">
            Apply filters
          </Button>
        </div>
      </form>

      {data.items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-base-800 p-6 text-sm text-white/60">
          No products match the current filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        basePath="/catalog"
        query={{ pageSize: data.pageSize, query, gameTypeId, expansionId }}
      />
    </div>
  );
}
