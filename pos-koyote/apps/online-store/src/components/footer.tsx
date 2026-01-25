import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="border-t border-white/5 py-8 text-sm text-white/50">
      <div className="mx-auto w-full max-w-6xl px-4">
        {t("common.footer.label")}
      </div>
    </footer>
  );
}
