"use client";

import {
	MenuRounded as MenuIcon,
	MenuOpenRounded as MenuOpenIcon,
} from "@mui/icons-material";
import { IconButton, type IconButtonProps } from "@mui/material";
import type React from "react";

import { useScreenSize } from "@/hooks/useScreenSize";

import { useDrawerContext } from "../DrawerContext";

export type DrawerHeaderProps = IconButtonProps;

export const DrawerHamburger: React.FC<DrawerHeaderProps> = ({
	...iconButtonProps
}) => {
	const screenSize = useScreenSize();
	const { isOpen, toggleVisibility } = useDrawerContext();

	// MenuIcon = Three horizontal lines
	// MenuOpenIcon = Arrow pointing left with three horizontal lines
	return (
		<IconButton onClick={() => toggleVisibility()} {...iconButtonProps}>
			{isOpen(screenSize) ? <MenuOpenIcon /> : <MenuIcon />}
		</IconButton>
	);
};
