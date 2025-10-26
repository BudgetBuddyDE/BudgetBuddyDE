import { createTheme, ThemeProvider } from "@mui/material";
import { render } from "@testing-library/react";

import { PieChart, type PieChartProps } from "./PieChart";

describe("PieChart", () => {
	const theme = createTheme();

	const renderWithTheme = (props: PieChartProps) =>
		render(
			<ThemeProvider theme={theme}>
				<PieChart {...props} />
			</ThemeProvider>,
		);

	it("renders without crashing", () => {
		const props: PieChartProps = {
			series: [
				{
					data: [
						{ value: 10, label: "Label 1" },
						{ value: 20, label: "Label 2" },
					],
				},
			],
		};
		const { container } = renderWithTheme(props);
		expect(container).toBeInTheDocument();
	});

	it("renders primary and secondary text in the center label", () => {
		const props: PieChartProps = {
			series: [
				{
					data: [
						{ value: 10, label: "Label 1" },
						{ value: 20, label: "Label 2" },
					],
				},
			],
			primaryText: "Primary Text",
			secondaryText: "Secondary Text",
		};
		const { getByText } = renderWithTheme(props);
		expect(getByText("Primary Text")).toBeInTheDocument();
		expect(getByText("Secondary Text")).toBeInTheDocument();
	});
});
