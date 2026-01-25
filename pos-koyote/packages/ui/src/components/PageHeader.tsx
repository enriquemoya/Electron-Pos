type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-zinc-400">{subtitle}</p>
      ) : null}
    </div>
  );
}