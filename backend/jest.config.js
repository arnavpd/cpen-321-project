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
  testTimeout: 30000,
  verbose: true,
  // Reduced memory optimization settings
  maxWorkers: 1, // Further limit concurrent workers to avoid memory issues
  workerIdleMemoryLimit: '512MB', // Lower memory limit to restart workers sooner
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