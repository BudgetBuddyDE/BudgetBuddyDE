"use client";

import { Box, Grid } from "@mui/material";
import React from "react";
import { DataDisclaimer } from "@/components/Stocks/DataDisclaimer";

export default function Layout({ children }: React.PropsWithChildren) {
	return (
		<React.Fragment>
			{children}
			<Grid size={{ xs: 12 }}>
				<Box sx={{ pt: 2 }}>
					<DataDisclaimer />
				</Box>
			</Grid>
		</React.Fragment>
	);
}
