import { CloseRounded } from "@mui/icons-material";
import { IconButton, Stack, Typography } from "@mui/material";
import type React from "react";
import { ActionPaper } from "@/components/ActionPaper";

export type EntityHeaderProps = {
	title: string;
	subtitle?: string;
	onClose: () => void;
};

export const EntityHeader: React.FC<EntityHeaderProps> = ({
	title,
	subtitle,
	onClose,
}) => {
	return (
		<Stack
			direction={"row"}
			justifyContent={"space-between"}
			alignItems={"center"}
			sx={{ p: 2, pb: 0 }}
		>
			<Stack>
				<Typography variant="subtitle1" fontWeight="bold">
					{title}
				</Typography>
				{Boolean(subtitle) && (
					<Typography variant="subtitle2" fontWeight="bold">
						{subtitle}
					</Typography>
				)}
			</Stack>
			<ActionPaper>
				<IconButton color="primary" onClick={onClose}>
					<CloseRounded />
				</IconButton>
			</ActionPaper>
		</Stack>
	);
};
