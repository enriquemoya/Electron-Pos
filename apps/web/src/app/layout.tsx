import "./globals.css";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Sidebar } from "@pos/ui";
import { t } from "./i18n";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata = {
  title: t("metadataTitle"),
  description: t("metadataDescription")
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-base-900 text-zinc-100">
        <div className="flex min-h-screen">
          <Sidebar
            appName={t("appName")}
            eyebrow={t("sidebarEyebrow")}
            activeBadge={t("sidebarActiveBadge")}
            inactiveBadge={t("sidebarInactiveBadge")}
            footerText={t("sidebarFooter")}
            items={[
              { href: "/dashboard", label: t("navDashboard") },
              { href: "/products", label: t("navProducts") },
              { href: "/new-sale", label: t("navNewSale") },
              { href: "/inventory", label: t("navInventory") },
              { href: "/sales", label: t("navSales") },
              { href: "/tournaments", label: t("navTournaments") },
              { href: "/customers", label: t("navCustomers") },
              { href: "/reports/daily", label: t("navReports") },
              { href: "/settings", label: t("navSettings") }
            ]}
          />
          <main className="flex-1 bg-base-800 p-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
