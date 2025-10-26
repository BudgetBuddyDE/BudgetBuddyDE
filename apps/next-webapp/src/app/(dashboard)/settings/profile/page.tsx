import { Grid } from "@mui/material";
import { PageHeader } from "@/components/Layout/PageHeader";
import { AppInformation } from "@/components/Settings/AppInformation";
import { EditUser } from "@/components/User/EditUser";
import { ProfileHeader } from "@/components/User/ProfileHeader";
import { UserAccounts } from "@/components/User/UserAccounts";
import { UserSessions } from "@/components/User/UserSessions";

export default function SettingsProfilePage() {
	return (
		<Grid container spacing={2}>
			<PageHeader
				title="Profile"
				description="Manage your profile settings here."
			/>

			<Grid size={{ xs: 12 }}>
				<ProfileHeader />
			</Grid>

			<Grid container size={{ xs: 12, md: 3.5 }} spacing={2}>
				<Grid size={{ xs: 12 }}>
					<AppInformation />
				</Grid>

				{/* REVISIT: Implement newsletter management */}
			</Grid>

			<Grid container size={{ xs: 12, md: 5 }}>
				<Grid size={{ xs: 12 }}>
					<EditUser />
				</Grid>
			</Grid>

			<Grid container size={{ xs: 12, md: 3.5 }} spacing={2}>
				<Grid size={{ xs: 12 }}>
					<UserAccounts />
				</Grid>

				<Grid size={{ xs: 12 }}>
					<UserSessions />
				</Grid>
			</Grid>
		</Grid>
	);
}
