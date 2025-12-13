// biome-ignore lint/complexity/noStaticOnlyClass: Justification: Utility class with static methods is fine
export class PercentageFormatter {
	static format(value: number): string {
		return `${value.toFixed(2)} %`;
	}
}
