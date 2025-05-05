import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image
          alt="BudgetBuddyDE Logo"
          src={"/logo.png"}
          sizes="100px"
          className="hidden w-20 md:w-24"
          width={100}
          height={100}
          aria-label="BudgetBuddyDE Logo"
        />
        BudgetBuddyDE
      </>
    ),
  },
  githubUrl: "https://github.com/BudgetBuddyDE/BudgetBuddyDE",
  links: [],
  themeSwitch: {
    mode: "light-dark-system",
  },
};
