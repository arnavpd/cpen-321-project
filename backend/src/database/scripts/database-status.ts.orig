import mongoose from 'mongoose';

const checkDatabases = async () => {
  try {
    // Connect to MongoDB server
    await mongoose.connect('mongodb://localhost:27017');
    
    // List all databases
    const admin = mongoose.connection.db.admin();
    const result = await admin.listDatabases();
    
    console.log('🔍 Available databases:');
    result.databases.forEach(db => {
      console.log(`  - ${db.name} (${Math.round(db.sizeOnDisk / 1024)} KB)`);
    });
    
    // Check if cpen321-project exists and has collections
    try {
      await mongoose.connect('mongodb://localhost:27017/cpen321-project');
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      console.log(`\n📊 Collections in 'cpen321-project' database:`);
      if (collections.length === 0) {
        console.log('  No collections found!');
      } else {
        for (const collection of collections) {
          const count = await mongoose.connection.db.collection(collection.name).countDocuments();
          console.log(`  - ${collection.name}: ${count} documents`);
        }
      }
      
    } catch (error) {
      console.log('\n❌ Error accessing cpen321-project database:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkDatabases();