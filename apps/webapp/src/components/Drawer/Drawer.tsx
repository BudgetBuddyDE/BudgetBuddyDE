"use client";

import {
	Drawer as MuiDrawer,
	type DrawerProps as MuiDrawerProps,
	SwipeableDrawer,
	type SwipeableDrawerProps,
} from "@mui/material";
import React from "react";
import { useScreenSize } from "@/hooks/useScreenSize";
import { DrawerWidth } from "@/theme/style";
import { determineOS } from "@/utils/determineOS";

export type DrawerProps = React.PropsWithChildren<
	(MuiDrawerProps | SwipeableDrawerProps) & {
		closeOnBackdropClick?: boolean;
		closeOnEscape?: boolean;
	}
>;

export const Drawer: React.FC<DrawerProps> = ({
	children,
	closeOnBackdropClick,
	closeOnEscape,
	...props
}) => {
	const screenSize = useScreenSize();
	const isIOS = determineOS(navigator.userAgent) === "iOS";

	const drawerAnchor: "bottom" | "right" = React.useMemo(() => {
		return screenSize === "small" ? "bottom" : "right";
	}, [screenSize]);

	const handleClose = React.useCallback(
		(event: unknown, reason: "backdropClick" | "escapeKeyDown") => {
			if (
				!props.onClose ||
				(reason === "backdropClick" && !closeOnBackdropClick) ||
				(reason === "escapeKeyDown" && !closeOnEscape)
			) {
				return;
			}

			// event: {} should be fine as this is in their Drawer.d.ts  file
			// onClose?: ModalProps['onClose'];
			// will be onClose?: { bivarianceHack(event: {}, reason: 'backdropClick' | 'escapeKeyDown'): void; }['bivarianceHack'];
			// biome-ignore lint/complexity/noBannedTypes: This is just the type they expect
			return props.onClose(event as React.SyntheticEvent<{}, Event>, reason);
		},
		[closeOnBackdropClick, closeOnEscape, props.onClose],
	);

	if (drawerAnchor === "bottom") {
		return (
			<SwipeableDrawer
				// IMPORTANT: Keep this value set to false in order to prevent issues with the Autocomplete components of the EntityDrawer
				// When the value is not set, "value" and "defaultValue" props are not properly applied due to
				// the component being kept mounted but unrendered when closed and loosing its "controlled" state
				// I don't relly understand why this is happening, but setting keepMounted to false solves the issue
				ModalProps={{ keepMounted: false }}
				anchor={drawerAnchor}
				disableBackdropTransition={!isIOS}
				disableDiscovery={isIOS}
				{...props}
				onOpen={() => {}}
				onClose={() => handleClose({}, "backdropClick")}
				slotProps={{
					paper: {
						elevation: 0,
						...props.slotProps?.paper,
						sx: {
							borderTopLeftRadius: (theme) => `${theme.shape.borderRadius}px`,
							borderTopRightRadius: (theme) => `${theme.shape.borderRadius}px`,
							// REVISIT: ...props.slotProps?.paper?.sx,
						},
					},
				}}
			>
				{children}
			</SwipeableDrawer>
		);
	}
	return (
		<MuiDrawer
			anchor={drawerAnchor}
			{...props}
			onClose={handleClose}
			slotProps={{
				paper: {
					elevation: 0,
					...props.slotProps?.paper,
					sx: {
						boxSizing: "border-box",
						width: DrawerWidth * 2,
						// REVISIT:...props.slotProps?.paper?.sx,
					},
				},
			}}
		>
			{children}
		</MuiDrawer>
	);
};
