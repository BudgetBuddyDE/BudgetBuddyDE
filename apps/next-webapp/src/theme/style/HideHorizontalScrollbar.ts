import type { SxProps, Theme } from "@mui/material";

export const HideHorizontalScrollbarStyle: SxProps<Theme> = {
	"::-webkit-scrollbar": {
		display: "none",
	},
	scrollbarWidth: "none",
};
