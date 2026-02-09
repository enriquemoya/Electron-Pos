import createMiddleware from "next-intl/middleware";

const locales = ["es", "en"];

export default createMiddleware({
  locales,
  defaultLocale: "es",
  localeDetection: false
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
