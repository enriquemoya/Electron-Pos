type CardProps = {
  title: string;
  description: string;
};

export function Card({ title, description }: CardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-base-700/60 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-zinc-300">{description}</p>
    </div>
  );
}