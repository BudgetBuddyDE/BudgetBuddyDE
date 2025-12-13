import type React from "react";
import { LayoutWrapper } from "./layout-wrapper";
import { StoreProvider } from "./StoreProvider";

export const metadata = {
  title: "Budget Buddy",
  description: "Manage your budgets effortlessly with Budget Buddy.",
  manifest: "/manifest.json",
  themeColor: "#151936",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<StoreProvider>
			<html lang="en" suppressHydrationWarning>
				<body>
					<LayoutWrapper>{children}</LayoutWrapper>
				</body>
			</html>
		</StoreProvider>
	);
}
