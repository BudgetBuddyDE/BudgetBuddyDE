import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "BudgetBuddyDE",
  description: "BudgetBuddyDE - Your personal finance buddy",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>

        {process.env.NODE_ENV === "production" && (
          <Script
            async
            src="https://analytics.tools.tklein.it/script.js"
            data-website-id="2876313f-9ed3-4497-9a47-65b4f42a4155"
          />
        )}
      </body>
    </html>
  );
}
