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
  // Memory optimization settings
  maxWorkers: 2, // Limit concurrent workers
  workerIdleMemoryLimit: '1028MB', // Restart workers when they exceed this memory
  detectOpenHandles: false, // Disable to reduce memory overhead
  forceExit: true, // Force exit to prevent hanging
  // Cache settings to reduce memory usage
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  clearMocks: true,
  restoreMocks: true,
};