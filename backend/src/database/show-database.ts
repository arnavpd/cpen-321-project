import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Hardcode connection
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

/**
 * Display all collections and their sample data
 */
const showDatabaseContent = async (): Promise<void> => {
  try {
    console.log('🔍 Checking database content...');
    
    // Connect to MongoDB
    await connectDB();

    // Get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📊 Found ${collections.length} collections:\n`);

    for (const collection of collections) {
      const collectionName = collection.name;
      const coll = db.collection(collectionName);
      const count = await coll.countDocuments();
      console.log(`📁 ${collectionName}: ${count} documents`);
      
      if (count > 0 && count <= 3) {
        // Show sample documents for small collections
        const samples = await coll.find({}).limit(2).toArray();
        samples.forEach((doc, index) => {
          console.log(`   Sample ${index + 1}:`, {
            _id: doc._id,
            ...Object.fromEntries(
              Object.entries(doc)
                .filter(([key]) => !key.startsWith('_'))
                .slice(0, 3)
                .map(([key, value]) => [
                  key,
                  typeof value === 'string' && value.length > 50 
                    ? value.substring(0, 50) + '...' 
                    : value
                ])
            )
          });
        });
      }
      console.log('');
    }

    // Check if all expected collections exist
    const expectedCollections = [
      'users', 'projects', 'tasks', 'expenses', 
      'chatmessages', 'notifications', 'projectinvitations'
    ];
    
    const existingCollectionNames = collections.map(c => c.name);
    const missingCollections = expectedCollections.filter(
      name => !existingCollectionNames.includes(name)
    );

    if (missingCollections.length > 0) {
      console.log(`⚠️  Missing collections: ${missingCollections.join(', ')}`);
      console.log('   These collections will appear in MongoDB Compass once they have data.');
    }

    console.log('\n💡 To see all collections in MongoDB Compass:');
    console.log('   1. Refresh/reconnect to your database');
    console.log('   2. Collections without data won\'t appear until they have documents');
    console.log('   3. Use the seeding script to add sample data to empty collections');
    
  } catch (error) {
    console.error('❌ Error checking database content:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  showDatabaseContent()
    .then(() => {
      console.log('\n🎉 Database content check completed!');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('💥 Database content check failed:', error);
      process.exit(1);
    });
}

export { showDatabaseContent };