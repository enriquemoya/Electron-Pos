import "./globals.css";

import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-base-900 text-white">{children}</body>
    </html>
  );
}
