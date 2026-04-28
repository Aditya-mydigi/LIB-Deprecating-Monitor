import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "API Deprecation Monitor",
  description:
    "Monitor GitHub repositories for API deprecation warnings. Connect your repos and get alerted before breaking changes hit production.",
  keywords: ["API monitoring", "GitHub", "deprecation", "developer tools"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
