import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Alias opcional si usas @/ en imports
  },
  testMatch: ['**/tests/**/*.test.ts'],
};

export default config;