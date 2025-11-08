// Test-specific database connection utilities
import mongoose from 'mongoose';

export const connectTestDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cpen321-project';

    // CI-specific connection options for tests only
    const connectionOptions = {
      serverSelectionTimeoutMS: process.env.CI ? 15000 : 5000, // Longer timeout in CI
      socketTimeoutMS: process.env.CI ? 15000 : 0,
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: process.env.CI ? 5 : 10, // Smaller pool in CI
    };

    console.log(`🔄 Connecting to test MongoDB: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(uri, connectionOptions);

    console.log(`✅ Test MongoDB connected successfully`);

    mongoose.connection.on('error', error => {
      console.error('❌ Test MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Test MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ Failed to connect to test MongoDB:', error);
    if (process.env.CI) {
      console.error('CI Environment - MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
    }
    throw error; // Re-throw in test environment to fail fast
  }
};

export const disconnectTestDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ Test MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from test MongoDB:', error);
  }
};