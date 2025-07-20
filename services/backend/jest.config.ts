import type { Config } from "jest";
import path from "path";

const config: Config = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 50 * 1000, // 50 seconds
  testMatch: ["<rootDir>/test/**/*.(test|spec).ts"],
  modulePathIgnorePatterns: ["<rootDir>/gen/srv"],
  globalSetup: path.join(__dirname, "test", "setup.ts"),
};

export default config;
