// Jest setup file for test environment
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Increase test timeout for database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};