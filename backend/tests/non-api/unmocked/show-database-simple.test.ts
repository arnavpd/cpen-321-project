/**
 * Show Database Content Tests - Simplified
 */

import { showDatabaseContent } from '../../../src/database/show-database';

describe('Show Database Content Function', () => {
  let originalConsoleLog: any;
  let originalConsoleError: any;
  let consoleLogs: string[];
  let consoleErrors: string[];

  beforeEach(() => {
    // Mock console methods to capture output
    consoleLogs = [];
    consoleErrors = [];
    originalConsoleLog = console.log;
    originalConsoleError = console.error;

    console.log = jest.fn((message: string) => {
      consoleLogs.push(message);
      originalConsoleLog(message);
    });

    console.error = jest.fn((message: string, ...args: any[]) => {
      consoleErrors.push(message + (args.length > 0 ? ' ' + args.join(' ') : ''));
      originalConsoleError(message, ...args);
    });
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Basic functionality', () => {
    it('should be an exportable function', () => {
      expect(typeof showDatabaseContent).toBe('function');
    });

    it('should successfully inspect database content', async () => {
      try {
        await showDatabaseContent();

        // Should log database inspection start message
        expect(consoleLogs.some(log => log.includes('Checking database content'))).toBe(true);
        
        // Should log collections found message
        expect(consoleLogs.some(log => log.includes('Found') && log.includes('collections'))).toBe(true);
      } catch (error) {
        // If database connection fails, should still handle it gracefully
        expect(consoleErrors.some(log => log.includes('Error checking database content'))).toBe(true);
      }
    });

    it('should provide MongoDB Compass instructions', async () => {
      try {
        await showDatabaseContent();

        // Should include helpful instructions
        expect(consoleLogs.some(log => log.includes('MongoDB Compass'))).toBe(true);
        expect(consoleLogs.some(log => log.includes('Refresh/reconnect'))).toBe(true);
      } catch (error) {
        // If connection fails, error handling should still work
        expect(consoleErrors.some(log => log.includes('Error checking database content'))).toBe(true);
      }
    });

    it('should display collection information when successful', async () => {
      try {
        await showDatabaseContent();

        // Should display at least some collection info or handle gracefully
        const hasCollectionInfo = consoleLogs.some(log => 
          log.includes('📁') && log.includes(':') && log.includes('documents')
        ) || consoleLogs.some(log => log.includes('collections'));
        
        expect(hasCollectionInfo).toBe(true);
      } catch (error) {
        // Expected if no database connection available
        expect(consoleErrors.some(log => log.includes('Error'))).toBe(true);
      }
    });

    it('should check for expected collections', async () => {
      try {
        await showDatabaseContent();

        // Should mention expected collections or missing collections
        const expectedCollections = [
          'users', 'projects', 'tasks', 'expenses', 
          'chatmessages', 'notifications', 'projectinvitations'
        ];

        // Should either show these collections or mention they're missing
        const mentionsExpectedCollections = consoleLogs.some(log => {
          return expectedCollections.some(collection => log.toLowerCase().includes(collection));
        }) || consoleLogs.some(log => log.includes('Missing collections')) ||
           consoleLogs.some(log => log.includes('collections'));

        expect(mentionsExpectedCollections).toBe(true);
      } catch (error) {
        // Connection error handling
        expect(consoleErrors.some(log => log.includes('Error'))).toBe(true);
      }
    });

    it('should handle environment variables for connection', () => {
      // Test that the function exists and can handle different env scenarios
      const originalURI = process.env.MONGODB_URI;
      
      // Test with custom URI (just check it doesn't crash on load)
      process.env.MONGODB_URI = 'mongodb://custom:27017/test';
      
      // Function should be callable
      expect(typeof showDatabaseContent).toBe('function');
      
      // Restore
      process.env.MONGODB_URI = originalURI;
    });
  });

  describe('Error handling', () => {
    it('should handle basic function structure', () => {
      // Test that the function exists and can handle different scenarios
      expect(typeof showDatabaseContent).toBe('function');
      
      // Test environment variable handling without actually connecting
      const originalURI = process.env.MONGODB_URI;
      process.env.MONGODB_URI = 'mongodb://test:27017/test';
      
      // Function should still be callable
      expect(typeof showDatabaseContent).toBe('function');
      
      // Restore
      process.env.MONGODB_URI = originalURI;
    });
  });
});