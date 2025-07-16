export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // testTimeout: 99999999,
  testMatch: ['<rootDir>/test/**/*.(test|spec).ts'],
  modulePathIgnorePatterns: ['<rootDir>/gen/srv'],
};
