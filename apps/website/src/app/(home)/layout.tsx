import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/app/layout.config";
import { Footer } from "@/components/Footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      {...baseOptions}
      links={[
        {
          text: "App",
          url: "https://app.budget-buddy.de",
        },
        {
          text: "Documentation",
          url: "/docs",
        },
        {
          text: "CI/CD",
          url: "https://ci.tools.tklein.it",
        },
      ]}
    >
      {children}
      <Footer />
    </HomeLayout>
  );
}
