import { getPort } from "./getPort";

describe("getPort", () => {
	it("should return the port number from the environment variable when envPort is a valid number", () => {
		process.env.PORT = "5000";
		const port = getPort();
		expect(port).toBe(5000);
	});

	it("should return the fallback port number when envPort is not set", () => {
		delete process.env.PORT;
		const port = getPort(3000);
		expect(port).toBe(3000);
	});

	it("should return the fallback port number when envPort is not a valid number", () => {
		process.env.PORT = "invalid";
		const port = getPort(3000);
		expect(port).toBe(3000);
	});

	it("should return the default fallback port number when envPort is not set and no fallback is provided", () => {
		delete process.env.PORT;
		const port = getPort();
		expect(port).toBe(3000);
	});

	it("should parse a float string as an integer port", () => {
		process.env.PORT = "8080.9";
		const port = getPort();
		expect(port).toBe(8080);
	});

	it("should accept port 0 as a valid port number", () => {
		process.env.PORT = "0";
		const port = getPort(3000);
		expect(port).toBe(0);
	});
});
