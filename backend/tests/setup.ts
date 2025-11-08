// Jest setup file for test environment
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Increase test timeout for database operations, especially in CI
jest.setTimeout(process.env.CI ? 60000 : 30000);

// Mock console methods to reduce noise during tests (but not in CI for debugging)
if (!process.env.CI) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}