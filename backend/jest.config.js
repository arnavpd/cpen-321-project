/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        isolatedModules: true
      },
      diagnostics: {
        ignoreCodes: [151002]
      }
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/database/database-init.ts',
    '!src/database/scripts/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: process.env.CI ? 60000 : 30000, // Longer timeout in CI environment
  verbose: true,
  // CI-optimized settings
  maxWorkers: process.env.CI ? 1 : 2, // Single worker in CI to avoid resource conflicts
  workerIdleMemoryLimit: process.env.CI ? '256MB' : '512MB', // Lower memory limit in CI
  detectOpenHandles: true, // Re-enable to catch resource leaks
  forceExit: true, // Force exit to prevent hanging
  // Cache settings to reduce memory usage
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  clearMocks: true,
  restoreMocks: true,
  // Additional stability settings
  bail: false, // Don't stop on first failure
  passWithNoTests: true,
  errorOnDeprecated: false
};