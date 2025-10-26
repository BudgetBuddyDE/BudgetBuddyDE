import { toCSV } from "./toCSV";

describe("toCSV", () => {
	test.skip("it should throw an error when an invalid input object is provided", () => {});

	test("it should throw an error when no fields are provided", () => {
		const input = [
			{ name: "John", surname: "Doe", age: 55, sex: "m" },
			{ name: "Hubert", surname: "Doe", age: 12, sex: "m" },
		];

		expect(() => toCSV(input, [])).toThrowError(/No fields have been defined/);
	});

	test.skip("it should transform the input according to the provided parameter-values", () => {});
});
