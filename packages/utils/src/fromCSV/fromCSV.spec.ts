import { describe, expect, test } from "vitest";
import { fromCSV } from "./fromCSV";

describe("fromCSV", () => {
	test("it should throw an error when input is not a string", () => {
		// @ts-expect-error
		expect(() => fromCSV(123)).toThrowError(/Input must be a string/);
		// @ts-expect-error
		expect(() => fromCSV(null)).toThrowError(/Input must be a string/);
	});

	test("it should throw an error when input string is empty", () => {
		expect(() => fromCSV("")).toThrowError(/Input string cannot be empty/);
	});

	test("it should parse values automatically (defaultTransform) when parseValues is true", () => {
		const csv = "name,age,active\nAlice,30,true\nBob,25,false";
		const result = fromCSV(csv, { parseValues: true });
		expect(result).toEqual([
			{ name: "Alice", age: 30, active: true },
			{ name: "Bob", age: 25, active: false },
		]);
	});

	test("it should not parse values (all strings) if parseValues option is not set", () => {
		const csv = "name,age,active\nAlice,30,true\nBob,25,false";
		const result = fromCSV(csv);
		expect(result).toEqual([
			{ name: "Alice", age: "30", active: "true" },
			{ name: "Bob", age: "25", active: "false" },
		]);
	});

	test("it should parse values using a custom function", () => {
		const csv = "name,score\nAlice,5\nBob,10";
		const customParse = (val: string) =>
			val === "Alice" ? "A" : /^\d+$/.test(val) ? Number(val) * 2 : val;
		const result = fromCSV(csv, { parseValues: true, parseFunc: customParse });
		expect(result).toEqual([
			{ name: "A", score: 10 },
			{ name: "Bob", score: 20 },
		]);
	});

	test("it should parse shouldn't values when parseValues is false", () => {
		const csv = "name,score\nAlice,5\nBob,10";
		const customParse = (val: string) =>
			val === "Alice" ? "A" : /^\d+$/.test(val) ? Number(val) * 2 : val;
		const result = fromCSV(csv, { parseValues: false, parseFunc: customParse });
		expect(result).toEqual([
			{ name: "Alice", score: "5" },
			{ name: "Bob", score: "10" },
		]);
	});

	test("it should convert CSV to JSON as expected", () => {
		const csv = "city,temp\nBerlin,22\nParis,28";
		const result = fromCSV(csv);
		expect(result).toEqual([
			{ city: "Berlin", temp: "22" },
			{ city: "Paris", temp: "28" },
		]);
	});
});
