"use client";

import {
	alpha,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Tooltip,
	useTheme,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useDrawerContext } from "../DrawerContext";

export type DrawerItemProps = {
	open: boolean;
	text: string;
	path: string;
	icon: React.ReactNode;
	closeOnClick?: boolean;
};

export const DrawerItem: React.FC<DrawerItemProps> = ({
	open,
	text,
	path,
	icon,
	closeOnClick = false,
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const theme = useTheme();
	const { toggleVisibility } = useDrawerContext();

	const isActive: boolean = React.useMemo(() => {
		return pathname === path || pathname.startsWith(`${path}/`);
	}, [pathname, path]);

	const handler = {
		onClick: () => {
			if (closeOnClick) {
				toggleVisibility();
			}
			router.push(path);
		},
	};

	return (
		<Tooltip key={text} title={open ? "" : text} placement="right">
			<ListItem disablePadding sx={{ display: "block" }}>
				<ListItemButton
					sx={{
						mx: 1,
						height: 48,
						minHeight: 48,
						justifyContent: open ? "initial" : "center",
						px: 2,
						backgroundColor: isActive
							? alpha(theme.palette.primary.main, 0.2)
							: "transparent",
						color: isActive ? "primary.main" : "text.primary",
						borderRadius: `${theme.shape.borderRadius}px`,
						":hover": {
							backgroundColor: isActive
								? alpha(theme.palette.primary.main, 0.3)
								: "action.hover",
						},
					}}
					onClick={handler.onClick}
				>
					<ListItemIcon
						sx={{
							minWidth: 0,
							mr: open ? 3 : "auto",
							justifyContent: "center",
							color: "inherit",
						}}
					>
						{icon}
					</ListItemIcon>
					<ListItemText primary={text} sx={{ opacity: open ? 1 : 0 }} />
				</ListItemButton>
			</ListItem>
		</Tooltip>
	);
};
