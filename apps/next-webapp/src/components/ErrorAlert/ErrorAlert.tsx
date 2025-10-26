"use client";

import { Alert, type AlertProps, AlertTitle } from "@mui/material";
import React from "react";

/**
 * Props for the {@link ErrorAlert} component.
 *
 * Extends the standard {@link AlertProps} from Material-UI, and adds an optional {@link error} property.
 */
export type ErrorAlertProps = {
	/**
	 * The error to display.
	 */
	error?: Error | string | null;
	isDismissable?: boolean;
} & AlertProps;

/**
 * A component that displays an error message in an {@link Alert} component.
 *
 * The error message includes the error name as the alert title and the error message as the alert description.
 * The alert can be closed by clicking the close button, which will hide the component.
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
	error,
	isDismissable = false,
	...alertProps
}) => {
	const [show, setShow] = React.useState(true);
	if (!show || !error) return null;
	if (isDismissable) {
		alertProps.onClose = () => setShow(false);
	}
	return (
		<Alert variant="standard" severity="error" {...alertProps}>
			<AlertTitle>
				{typeof error === "string" ? "Error" : error.name}
			</AlertTitle>
			{typeof error === "string" ? error : error.message}
		</Alert>
	);
};
