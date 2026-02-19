import "./globals.css";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { t } from "./i18n";
import { ActivationGate } from "@/components/terminal/activation-gate";

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
          <ActivationGate
            copy={{
              appName: t("appName"),
              sidebarEyebrow: t("sidebarEyebrow"),
              sidebarActiveBadge: t("sidebarActiveBadge"),
              sidebarInactiveBadge: t("sidebarInactiveBadge"),
              sidebarFooter: t("sidebarFooter"),
              nav: [
                { href: "/dashboard", label: t("navDashboard") },
                { href: "/products", label: t("navProducts") },
                { href: "/new-sale", label: t("navNewSale") },
                { href: "/inventory", label: t("navInventory") },
                { href: "/sales", label: t("navSales") },
                { href: "/tournaments", label: t("navTournaments") },
                { href: "/customers", label: t("navCustomers") },
                { href: "/reports/daily", label: t("navReports") },
                { href: "/settings", label: t("navSettings") }
              ],
              activationTitle: t("terminalActivationTitle"),
              activationDescription: t("terminalActivationDescription"),
              activationLabel: t("terminalActivationLabel"),
              activationPlaceholder: t("terminalActivationPlaceholder"),
              activateAction: t("terminalActivateAction"),
              activatingAction: t("terminalActivatingAction"),
              activatedMessage: t("terminalActivatedMessage"),
              notActivatedMessage: t("terminalNotActivatedMessage"),
              offlineMessage: t("terminalOfflineMessage"),
              revokedMessage: t("terminalRevokedMessage"),
              genericError: t("terminalGenericError"),
              invalidKeyError: t("terminalInvalidKeyError"),
              rateLimitedError: t("terminalRateLimitedError")
            }}
          >
            {children}
          </ActivationGate>
        </div>
      </body>
    </html>
  );
}
