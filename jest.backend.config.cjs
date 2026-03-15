/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: [
    "<rootDir>/tests/backend/unit/**/*.test.ts",
    "<rootDir>/tests/backend/api/**/*.test.ts",
    "<rootDir>/tests/backend/integration/**/*.test.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/backend/setup/backend-jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
