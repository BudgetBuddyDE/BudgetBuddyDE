import type { Metadata, Viewport } from "next";
import type React from "react";
import { LayoutWrapper } from "./layout-wrapper";
import { StoreProvider } from "./StoreProvider";

export const metadata: Metadata = {
	title: "Budget Buddy",
	description: "Manage your budgets effortlessly with Budget Buddy.",
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#151936" },
		{ media: "(prefers-color-scheme: dark)", color: "#151936" },
	],
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
