"use client";
import { styled } from "@mui/material";

export const AuthenticatedMain = styled("main")(({ theme }) => ({
	transition: theme.transitions.create("margin", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	[theme.breakpoints.down("sm")]: {
		marginLeft: 0,
	},
}));
