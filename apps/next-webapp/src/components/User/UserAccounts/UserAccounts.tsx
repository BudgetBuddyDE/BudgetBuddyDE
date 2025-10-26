import { Stack } from "@mui/material";
import { headers } from "next/headers";
import { authClient } from "@/authClient";
import { Card } from "@/components/Card";
import { AccountList } from "./AccountList";

export const UserAccounts = async () => {
	const { data, error } = await authClient.listAccounts({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (error) throw error;
	return (
		<Card sx={{ px: 0 }}>
			<Card.Header sx={{ px: 2 }}>
				<Stack>
					<Card.Title>Linked accounts</Card.Title>
					<Card.Subtitle>Manage your linked accounts</Card.Subtitle>
				</Stack>
			</Card.Header>
			<Card.Body>
				<AccountList accounts={data ?? []} />
			</Card.Body>
		</Card>
	);
};
