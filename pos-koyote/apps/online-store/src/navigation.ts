import { createNavigation } from "next-intl/navigation";

export const { Link, usePathname, useRouter } = createNavigation({
  locales: ["es", "en"],
  defaultLocale: "es"
});
