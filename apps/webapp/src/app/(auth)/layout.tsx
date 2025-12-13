import { Box, Container } from "@mui/material";
import type React from "react";
import { Footer } from "@/components/Layout/Footer";
import { UnauthenticatedMain } from "@/components/Layout/Main";

export default function Layout({ children }: React.PropsWithChildren) {
	return (
		<UnauthenticatedMain sx={{ position: "relative" }}>
			<Container maxWidth="xl" sx={{ mt: "auto", p: { xs: 2, md: 4 } }}>
				{children}
			</Container>
			<Box sx={{ mt: "auto" }}>
				<Footer />
			</Box>
		</UnauthenticatedMain>
	);
}
