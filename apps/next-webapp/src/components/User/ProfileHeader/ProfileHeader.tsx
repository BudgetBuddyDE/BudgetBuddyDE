"use client";

import { Box, Typography } from "@mui/material";
import { authClient } from "@/authClient";
import { Card } from "@/components/Card";
import { Avatar } from "../Avatar";
import styles from "./ProfileHeader.module.css";

export const ProfileHeader = () => {
	const { isPending, data, error } = authClient.useSession();
	if (error) throw error;
	if (isPending || !data) return null;
	return (
		<Card sx={{ p: 0 }} className={styles.profileHeader}>
			<Card.Header
				sx={{
					position: "relative",
					p: 0,
					aspectRatio: { xs: "6/2", md: "9/1" },
					backgroundSize: "100%",
					borderRadius: "inherit",
				}}
			>
				<Box
					sx={{
						display: "flex",
						m: { xs: 2, md: 4 },
					}}
				>
					<Avatar
						sx={{
							width: { xs: 64, md: 96 },
							height: { xs: 64, md: 96 },
						}}
					/>

					<Box sx={{ mt: "auto", mb: { xs: 0, md: 2 }, ml: 2 }}>
						<Typography variant="h5" fontWeight="bolder">
							{data.user.name}
						</Typography>
						<Typography variant="body2" fontWeight="bolder">
							{data.user.email}
						</Typography>
					</Box>
				</Box>
			</Card.Header>
		</Card>
	);
};
