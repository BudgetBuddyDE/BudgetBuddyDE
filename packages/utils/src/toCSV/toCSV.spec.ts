import { toCSV } from "./toCSV";

type TestType = {
	name: string;
	surname: string;
	age: number;
	sex: string;
};

describe("toCSV", () => {
	const input: TestType[] = [
		{ name: "John", surname: "Doe", age: 55, sex: "m" },
		{ name: "Hubert", surname: "Doe", age: 12, sex: "m" },
	];

	test("it should throw an error when an invalid input object is provided", () => {
		// @ts-expect-error
		expect(() => toCSV(null, ["name"])).toThrowError(/Input must be an array/);
		// @ts-expect-error
		expect(() => toCSV(123, ["name"])).toThrowError(/Input must be an array/);
	});

	test("it should throw an error when no fields are provided", () => {
		expect(() => toCSV(input, [])).toThrowError(/No fields have been defined/);
	});

	test("it should generate CSV with plain field names", () => {
		const csv = toCSV(input, ["name", "age"]);
		expect(csv).toBe("name,age\nJohn,55\nHubert,12");
	});

	test("it should generate CSV with field objects and aliases", () => {
		const csv = toCSV(input, [
			{ field: "name", as: "FirstName" },
			{ field: "surname", as: "LastName" },
			{ field: "age" },
		]);
		expect(csv).toBe("FirstName,LastName,age\nJohn,Doe,55\nHubert,Doe,12");
	});

	test("it should transform the input according to the provided parameter-values", () => {
		const csv = toCSV(input, [
			{
				field: "age",
				as: "isAdult",
				transform: (val: number) => (val >= 18 ? "yes" : "no"),
			},
			{
				field: "name",
				as: "uppercaseName",
				transform: (val: string) => val.toUpperCase(),
			},
		]);
		expect(csv).toBe("isAdult,uppercaseName\nyes,JOHN\nno,HUBERT");
	});

	test("transform function receives correct array and index", () => {
		const indices: number[] = [];
		const arrayRefs: TestType[][] = [];
		const csv = toCSV(input, [
			{
				field: "age",
				as: "originalAge",
				transform: (val, _item, arr, idx) => {
					indices.push(idx);
					arrayRefs.push(arr);
					return val;
				},
			},
		]);
		expect(csv).toBe("originalAge\n55\n12");
		expect(indices).toEqual([0, 1]);
		expect(arrayRefs[0]).toBe(input);
		expect(arrayRefs[1]).toBe(input);
	});

	test("it should handle custom separator option", () => {
		const csv = toCSV(input, ["name", "age"], { separator: ";" });
		expect(csv).toBe("name;age\nJohn;55\nHubert;12");
	});

	test("it should return empty string for empty array", () => {
		expect(toCSV([], ["name"])).toBe("");
	});

	test("it should use the field name as header when no alias is provided in field object", () => {
		const csv = toCSV(input, [{ field: "name" }, { field: "age" }]);
		expect(csv).toBe("name,age\nJohn,55\nHubert,12");
	});

	test("it should handle a single-item array", () => {
		const csv = toCSV([input[0]], ["name", "age"]);
		expect(csv).toBe("name,age\nJohn,55");
	});

	test("it should handle all fields in a single row", () => {
		const csv = toCSV(input, ["name", "surname", "age", "sex"]);
		expect(csv).toBe("name,surname,age,sex\nJohn,Doe,55,m\nHubert,Doe,12,m");
	});

	test("it should mix plain field names and field objects correctly", () => {
		const csv = toCSV(input, ["name", { field: "age", as: "years" }]);
		expect(csv).toBe("name,years\nJohn,55\nHubert,12");
	});
});
