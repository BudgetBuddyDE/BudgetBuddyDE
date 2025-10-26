import { Grid, Stack, Typography } from "@mui/material";
import { AppLogo } from "@/components/AppLogo";
import { Card } from "@/components/Card";

export default async function ConfirmUserDeletionPage() {
	return (
		<Grid container justifyContent="center">
			<Grid size={{ xs: 12, md: 4, xl: 3.5 }}>
				<Card sx={{ py: 3, px: 4 }}>
					<Card.Header>
						<Stack direction={"column"}></Stack>

						<AppLogo
							style={{
								marginLeft: "auto",
								marginRight: "auto",
								borderRadius: "5px",
							}}
							width={96}
							height={96}
						/>

						<Typography
							variant={"h5"}
							textAlign={"center"}
							fontWeight={"bolder"}
							sx={{ mt: 2 }}
						>
							Your account was deleted
						</Typography>
					</Card.Header>

					<Card.Header>
						<Typography variant="body1" gutterBottom>
							We're sorry to see you go. Your account deletion request has been
							received and is being processed. Please note that it may take up
							to 60 days for all of your data to be completely erased.
						</Typography>
					</Card.Header>
				</Card>
			</Grid>
		</Grid>
	);
}
