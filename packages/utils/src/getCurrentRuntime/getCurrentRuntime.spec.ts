import { getCurrentRuntime } from "./getCurrentRuntime";

describe("getCurrentRuntime", () => {
	const originalEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
	});

	it('should return "development" when NODE_ENV is not set', () => {
		process.env.NODE_ENV = undefined;
		const runtime = getCurrentRuntime();
		expect(runtime).toBe("development");
	});

	it('should return "production" when NODE_ENV is set to "production"', () => {
		process.env.NODE_ENV = "production";
		const runtime = getCurrentRuntime();
		expect(runtime).toBe("production");
	});

	it('should return "development" when NODE_ENV is set to "development"', () => {
		process.env.NODE_ENV = "development";
		const runtime = getCurrentRuntime();
		expect(runtime).toBe("development");
	});

	it('should return "test" when NODE_ENV is set to "test"', () => {
		process.env.NODE_ENV = "test";
		const runtime = getCurrentRuntime();
		expect(runtime).toBe("test");
	});

	it('should return "development" when NODE_ENV is set to an unknown value', () => {
		process.env.NODE_ENV = "unknown";
		const runtime = getCurrentRuntime();
		expect(runtime).toBe("development");
	});
});
