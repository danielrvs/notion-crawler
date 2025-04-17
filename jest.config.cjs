/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    testMatch: ['**/test/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  };