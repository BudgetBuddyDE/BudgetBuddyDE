import { getTrustedOrigins } from "./getTrustedOrigins";

describe("getTrustedOrigins", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = originalEnv;
	});

	it("should return an array of trusted origins from the environment variable", () => {
		process.env.TRUSTED_ORIGINS = "https://example.com,https://another.com";
		const origins = getTrustedOrigins();
		expect(origins).toEqual(["https://example.com", "https://another.com"]);
	});

	it("should return an array of trusted origins from an specific environment variable", () => {
		process.env.ORIGINS = "https://example.com,https://another.com";
		const origins = getTrustedOrigins("ORIGINS");
		expect(origins).toEqual(["https://example.com", "https://another.com"]);
	});

	it("should throw an error if the TRUSTED_ORIGINS environment variable is not set", () => {
		delete process.env.TRUSTED_ORIGINS;
		expect(getTrustedOrigins()).toEqual([]);
	});

	it("should return an array with a single origin if only one origin is set in the environment variable", () => {
		process.env.TRUSTED_ORIGINS = "https://single-origin.com";
		const origins = getTrustedOrigins();
		expect(origins).toEqual(["https://single-origin.com"]);
	});

	it("should handle empty strings in the TRUSTED_ORIGINS environment variable", () => {
		process.env.TRUSTED_ORIGINS = "";
		const origins = getTrustedOrigins();
		expect(origins).toEqual([]);
	});
});
