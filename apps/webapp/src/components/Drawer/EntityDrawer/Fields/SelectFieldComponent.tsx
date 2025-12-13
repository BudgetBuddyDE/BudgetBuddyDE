import {
	Grid,
	type GridProps,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	type TooltipProps,
} from "@mui/material";
import { type Control, Controller, type FieldValues } from "react-hook-form";
import { ActionPaper } from "@/components/ActionPaper";
import type { BaseAttributes } from "../types";

export type SelectField<T extends FieldValues> = Omit<
	BaseAttributes<
		{
			type: "select";
			options: {
				label: string;
				value: string | number;
				description?: string;
				descriptionPlacement?: TooltipProps["placement"];
			}[];
			exclusive?: boolean;
		},
		T
	>,
	"label" | "placeholder"
>;
export type SelectFieldComponentProps<T extends FieldValues> = {
	field: SelectField<T>;
	control: Control<T>;
	wrapperSize: GridProps["size"];
};

export const SelectFieldComponent = <T extends FieldValues>({
	field,
	control,
	wrapperSize,
}: SelectFieldComponentProps<T>) => {
	return (
		<Grid key={field.name} size={wrapperSize}>
			<ActionPaper>
				<Controller
					control={control}
					name={field.name}
					render={({ field: controllerField }) => (
						<ToggleButtonGroup
							color="primary"
							value={controllerField.value || null}
							onChange={(_, newValue) => {
								if (newValue !== null) controllerField.onChange(newValue);
							}}
							fullWidth
							exclusive={field.exclusive}
						>
							{field.options.map(
								({ value, label, description, descriptionPlacement }) => (
									<Tooltip
										key={value}
										title={description || ""}
										placement={descriptionPlacement || "bottom"}
									>
										<ToggleButton value={value} fullWidth>
											{label}
										</ToggleButton>
									</Tooltip>
								),
							)}
						</ToggleButtonGroup>
					)}
				/>
			</ActionPaper>
		</Grid>
	);
};
