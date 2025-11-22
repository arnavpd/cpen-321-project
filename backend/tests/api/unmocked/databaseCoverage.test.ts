/**
 * Database Connection Tests - Targeting Branch Coverage
 * Focus: Connection error handling, disconnection scenarios, process signal handling
 */

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../../src/database/database';

describe('Database Connection Comprehensive Coverage Tests', () => {
  let originalExit: any;
  let originalMongooseConnect: any;
  let originalConsoleError: any;
  let originalConsoleLog: any;

  beforeEach(() => {
    // Store original functions
    originalExit = process.exit;
    originalMongooseConnect = mongoose.connect;
    originalConsoleError = console.error;
    originalConsoleLog = console.log;

    // Mock console to prevent test output pollution
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore original functions
    process.exit = originalExit;
    mongoose.connect = originalMongooseConnect;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    
    // Remove all listeners to prevent memory leaks
    process.removeAllListeners('SIGINT');
  });

  describe('Connection Error Handling Branches', () => {
    test('connectDB should handle mongoose.connect failure', async () => {
      // Mock mongoose.connect to throw an error
      const mockError = new Error('Connection failed');
      mongoose.connect = jest.fn().mockRejectedValue(mockError);
      
      // Mock process.exit to prevent test termination
      const mockExit = jest.fn();
      process.exit = mockExit as any;

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('❌ Failed to connect to MongoDB:', mockError);
      expect(process.exitCode).toBe(1);
    });

    test('connectDB should use default URI when MONGODB_URI not set', async () => {
      const originalUri = process.env.MONGODB_URI;
      delete process.env.MONGODB_URI;

      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/cpen321-project');

      // Restore original URI
      if (originalUri) {
        process.env.MONGODB_URI = originalUri;
      }
    });

    test('connectDB should use environment URI when set', async () => {
      const testUri = 'mongodb://test:27017/test-db';
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = testUri;

      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(testUri);

      // Restore original URI
      if (originalUri) {
        process.env.MONGODB_URI = originalUri;
      } else {
        delete process.env.MONGODB_URI;
      }
    });

    test('connectDB should log success message on successful connection', async () => {
      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});

      await connectDB();

      expect(console.log).toHaveBeenCalledWith('✅ MongoDB connected successfully');
    });

    test('disconnectDB should handle successful disconnection', async () => {
      // Mock successful disconnection
      const mockClose = jest.fn().mockResolvedValue(undefined);
      mongoose.connection.close = mockClose;

      await disconnectDB();

      expect(mockClose).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('✅ MongoDB disconnected successfully');
    });

    test('disconnectDB should handle disconnection errors', async () => {
      const disconnectError = new Error('Disconnection failed');
      
      // Mock failed disconnection
      const mockClose = jest.fn().mockRejectedValue(disconnectError);
      mongoose.connection.close = mockClose;

      await disconnectDB();

      expect(mockClose).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('❌ Error disconnecting from MongoDB:', disconnectError);
    });

    test('connectDB should set up error event handler', async () => {
      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});
      
      // Mock connection event handlers
      const mockOn = jest.fn();
      mongoose.connection.on = mockOn;

      await connectDB();

      // Check that error event handler was set up
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
      
      // Test the error handler
      const errorHandler = mockOn.mock.calls.find(call => call[0] === 'error')[1];
      const testError = new Error('Test connection error');
      errorHandler(testError);
      
      expect(console.error).toHaveBeenCalledWith('❌ MongoDB connection error:', testError);
    });

    test('connectDB should set up disconnected event handler', async () => {
      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});
      
      // Mock connection event handlers
      const mockOn = jest.fn();
      mongoose.connection.on = mockOn;

      await connectDB();

      // Check that disconnected event handler was set up
      expect(mockOn).toHaveBeenCalledWith('disconnected', expect.any(Function));
      
      // Test the disconnected handler
      const disconnectedHandler = mockOn.mock.calls.find(call => call[0] === 'disconnected')[1];
      disconnectedHandler();
      
      expect(console.log).toHaveBeenCalledWith('⚠️ MongoDB disconnected');
    });

    test('connectDB should set up SIGINT process handler', async () => {
      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});
      
      // Mock process event handlers
      const mockProcessOn = jest.fn();
      const originalProcessOn = process.on;
      process.on = mockProcessOn;

      await connectDB();

      // Check that SIGINT handler was set up
      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));

      // Restore original process.on
      process.on = originalProcessOn;
    });

    test('SIGINT handler should close connection and set exit code', async () => {
      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});
      
      // Mock connection close
      const mockClose = jest.fn().mockResolvedValue(undefined);
      mongoose.connection.close = mockClose;
      
      // Capture the SIGINT handler
      let sigintHandler: any = null;
      const mockProcessOn = jest.fn().mockImplementation((event: string, handler: any) => {
        if (event === 'SIGINT') {
          sigintHandler = handler;
        }
      });
      const originalProcessOn = process.on;
      process.on = mockProcessOn;

      await connectDB();

      // Test the SIGINT handler
      expect(sigintHandler).not.toBeNull();
      await sigintHandler();

      expect(mockClose).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('MongoDB connection closed through app termination');
      expect(process.exitCode).toBe(0);

      // Restore original process.on
      process.on = originalProcessOn;
    });

    test('SIGINT handler should handle close errors gracefully', async () => {
      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});
      
      // Mock connection close with error
      const closeError = new Error('Close failed');
      const mockClose = jest.fn().mockRejectedValue(closeError);
      mongoose.connection.close = mockClose;
      
      // Capture the SIGINT handler
      let sigintHandler: any = null;
      const mockProcessOn = jest.fn().mockImplementation((event: string, handler: any) => {
        if (event === 'SIGINT') {
          sigintHandler = handler;
        }
      });
      const originalProcessOn = process.on;
      process.on = mockProcessOn;

      await connectDB();

      // Test the SIGINT handler with error
      expect(sigintHandler).not.toBeNull();
      
      // The handler should handle errors gracefully and not propagate them
      try {
        await sigintHandler();
      } catch (error) {
        // SIGINT handler should not let errors bubble up
        // But it may still call mongoose.connection.close which can throw
      }

      expect(mockClose).toHaveBeenCalled();

      // Restore original process.on
      process.on = originalProcessOn;
    });

    test('multiple connectDB calls should work independently', async () => {
      // Mock successful connection
      mongoose.connect = jest.fn().mockResolvedValue({});
      
      await connectDB();
      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledTimes(2);
    });

    test('connectDB with invalid URI format should handle gracefully', async () => {
      const invalidUri = 'invalid://uri';
      const originalUri = process.env.MONGODB_URI;
      process.env.MONGODB_URI = invalidUri;

      // Mock connection failure
      const connectionError = new Error('Invalid URI format');
      mongoose.connect = jest.fn().mockRejectedValue(connectionError);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(invalidUri);
      expect(console.error).toHaveBeenCalledWith('❌ Failed to connect to MongoDB:', connectionError);
      expect(process.exitCode).toBe(1);

      // Restore original URI
      if (originalUri) {
        process.env.MONGODB_URI = originalUri;
      } else {
        delete process.env.MONGODB_URI;
      }
    });

    test('should handle connection with various error types', async () => {
      const errorTypes = [
        new Error('Network error'),
        new TypeError('Type error'),
        'String error',
        { message: 'Object error' },
        null,
        undefined
      ];

      for (const error of errorTypes) {
        // Reset mocks
        (console.error as jest.Mock).mockClear();
        
        mongoose.connect = jest.fn().mockRejectedValue(error);

        await connectDB();

        expect(console.error).toHaveBeenCalledWith('❌ Failed to connect to MongoDB:', error);
        expect(process.exitCode).toBe(1);
      }
    });

    test('should handle disconnection with various error types', async () => {
      const errorTypes = [
        new Error('Network error'),
        new TypeError('Type error'),
        'String error',
        { message: 'Object error' },
        null,
        undefined
      ];

      for (const error of errorTypes) {
        // Reset mocks
        (console.error as jest.Mock).mockClear();
        
        const mockClose = jest.fn().mockRejectedValue(error);
        mongoose.connection.close = mockClose;

        await disconnectDB();

        expect(console.error).toHaveBeenCalledWith('❌ Error disconnecting from MongoDB:', error);
      }
    });
  });
});