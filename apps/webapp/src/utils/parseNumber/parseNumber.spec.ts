import { describe, expect, test } from "vitest";

import { parseNumber } from "./parseNumber";

describe("parseNumber", () => {
	test("should convert a positive number with comma to a decimal number", () => {
		expect(parseNumber("123,32")).toBeCloseTo(123.32);
	});

	test("should convert a negative number with comma to a decimal number", () => {
		expect(parseNumber("-123,32")).toBeCloseTo(-123.32);
	});

	test("should convert a whole number string without delimiters correctly", () => {
		expect(parseNumber("123")).toEqual(123);
	});

	test("should handle a string with period as decimal separator", () => {
		expect(parseNumber("123.45")).toEqual(123.45);
	});

	test("should return NaN for non-numeric input", () => {
		expect(parseNumber("abc")).toBeNaN();
	});
});
