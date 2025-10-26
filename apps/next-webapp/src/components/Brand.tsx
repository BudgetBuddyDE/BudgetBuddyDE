import { SavingsRounded as SavingsIcon } from "@mui/icons-material";
import {
	Box,
	type BoxProps,
	type IconProps,
	Typography,
	type TypographyProps,
} from "@mui/material";
import NextLink from "next/link";
import type React from "react";

export type TBrandProps = {
	boxStyle?: BoxProps["sx"];
	iconStyle?: IconProps["sx"];
	typographyStyle?: TypographyProps["sx"];
	asLink?: boolean;
};

export const Brand: React.FC<TBrandProps> = ({
	boxStyle,
	iconStyle,
	typographyStyle,
	asLink = false,
}) => {
	const appName = "BudgetBuddyDE";
	const baseProps: TypographyProps = {
		variant: "h5",
		noWrap: true,
		sx: {
			fontWeight: 700,
			color: "inherit",
			textDecoration: "none",
			...typographyStyle,
		},
	};

	return (
		<Box sx={{ display: "flex", alignItems: "center", ...boxStyle }}>
			<SavingsIcon sx={{ mr: 1, ...iconStyle }} />
			{asLink ? (
				<Typography component={NextLink} href="/" {...baseProps}>
					{appName}
				</Typography>
			) : (
				<Typography {...baseProps}>{appName}</Typography>
			)}
		</Box>
	);
};
