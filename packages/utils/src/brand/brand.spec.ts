import type { Branded } from "./brand";

type UserId = Branded<string, "UserId">;

function createUserId(id: string): UserId {
	return id as UserId;
}

function getUserById(id: UserId): string {
	return `User with ID: ${id}`;
}

describe("Brand", () => {
	it("should brand a string correctly", () => {
		const userId = createUserId("12345");
		expect(typeof userId).toBe("string");
	});

	it("should use branded string in functions correctly", () => {
		const userId = createUserId("12345");
		const result = getUserById(userId);
		expect(result).toBe("User with ID: 12345");
	});
});
