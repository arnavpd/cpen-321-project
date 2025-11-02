import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Hardcode connection for initialization
const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/cpen321-project';
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected successfully to ${uri}`);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};
import { userModel } from './user.model';
import { projectModel } from './project.model';
import { taskModel } from './task.model';
import { expenseModel } from './expense.model';
import { chatMessageModel } from './chatMessage.model';
import { notificationModel } from './notification.model';
};

/**
 * Database initialization script
 * This script sets up all the necessary indexes and collections for the project management application
 */

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('📊 Setting up collections and indexes...');

    // Initialize all models to ensure they're registered with Mongoose
    // This will create the collections if they don't exist
    await Promise.all([
      userModel,
      projectModel,
      taskModel,
      expenseModel,
      chatMessageModel,
      notificationModel,
      projectInvitationModel
    ]);

    console.log('✅ All models initialized successfully');

    // Create additional indexes for better performance
    await createAdditionalIndexes(db);

    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

/**
 * Create additional indexes for better query performance
 */
const createAdditionalIndexes = async (db: unknown): Promise<void> => {
  try {
    console.log('🔍 Creating additional indexes...');

    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ googleId: 1 }, { unique: true });
    await db.collection('users').createIndex({ ownedProjects: 1 });
    await db.collection('users').createIndex({ memberProjects: 1 });

    // Projects collection indexes
    await db.collection('projects').createIndex({ invitationCode: 1 }, { unique: true });
    await db.collection('projects').createIndex({ ownerId: 1 });
    await db.collection('projects').createIndex({ 'members.userId': 1 });
    await db.collection('projects').createIndex({ createdAt: -1 });
    await db.collection('projects').createIndex({ isActive: 1 });

    // Tasks collection indexes
    await db.collection('tasks').createIndex({ projectId: 1, createdAt: -1 });
    await db.collection('tasks').createIndex({ assignees: 1 });
    await db.collection('tasks').createIndex({ deadline: 1 });
    await db.collection('tasks').createIndex({ status: 1 });
    await db.collection('tasks').createIndex({ calendarEventId: 1 });

    // Expenses collection indexes
    await db.collection('expenses').createIndex({ projectId: 1, createdAt: -1 });
    await db.collection('expenses').createIndex({ 'splits.userId': 1 });
    await db.collection('expenses').createIndex({ status: 1 });
    await db.collection('expenses').createIndex({ createdBy: 1 });

    // Chat messages collection indexes
    await db.collection('chatmessages').createIndex({ projectId: 1, createdAt: 1 });
    await db.collection('chatmessages').createIndex({ senderId: 1 });
    await db.collection('chatmessages').createIndex({ isDeleted: 1 });

    // Notifications collection indexes
    await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ projectId: 1 });
    await db.collection('notifications').createIndex({ isRead: 1 });
    await db.collection('notifications').createIndex({ type: 1 });

    // Project invitations collection indexes
    await db.collection('projectinvitations').createIndex({ invitationCode: 1 }, { unique: true });
    await db.collection('projectinvitations').createIndex({ invitedEmail: 1 });
    await db.collection('projectinvitations').createIndex({ projectId: 1 });
    await db.collection('projectinvitations').createIndex({ status: 1 });
    await db.collection('projectinvitations').createIndex({ expiresAt: 1 });

    console.log('✅ All additional indexes created successfully');

  } catch (error) {
    console.error('❌ Error creating additional indexes:', error);
    throw error;
  }
};

/**
 * Clean up expired data
 */
export const cleanupExpiredData = async (): Promise<void> => {
  try {
    console.log('🧹 Starting cleanup of expired data...');

    // Clean up expired project invitations
    const expiredInvitations = await projectInvitationModel.cleanupExpiredInvitations();
    console.log(`🗑️ Cleaned up ${expiredInvitations} expired project invitations`);

    // Clean up old notifications (older than 30 days)
    const oldNotifications = await notificationModel.deleteOldNotifications(30);
    console.log(`🗑️ Cleaned up ${oldNotifications} old notifications`);

    console.log('✅ Cleanup completed successfully');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async (): Promise<unknown> => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collections = [
      'users',
      'projects', 
      'tasks',
      'expenses',
      'chatmessages',
      'notifications',
      'projectinvitations'
    ];

    const stats: unknown = {};

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        const indexes = await collection.indexes();
        
        stats[collectionName] = {
          documentCount: count,
          indexCount: indexes.length,
          indexes: indexes.map((idx: unknown) => idx.name)
        };
      } catch (error) {
        console.warn(`⚠️ Could not get stats for collection ${collectionName}:`, error);
        stats[collectionName] = { error: 'Collection not accessible' };
      }
    }

    return stats;

  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    throw error;
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization script completed!');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('💥 Database initialization script failed:', error);
      process.exit(1);
    });
}
