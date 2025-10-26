"use client";

import {
	CssBaseline,
	InitColorSchemeScript,
	ThemeProvider,
} from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import React from "react";
import { SnackbarProvider } from "@/components/Snackbar";
import theme from "@/theme";
// import ModeSwitch from '@/components/ModeSwitch';

export const LayoutWrapper: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	return (
		<React.Fragment>
			<InitColorSchemeScript attribute="class" />
			<AppRouterCacheProvider options={{ enableCssLayer: true }}>
				<ThemeProvider theme={theme}>
					{/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
					<CssBaseline />
					{/* <ModeSwitch /> */}
					<SnackbarProvider>{children}</SnackbarProvider>
				</ThemeProvider>
			</AppRouterCacheProvider>
		</React.Fragment>
	);
};
