import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const checkProjects = async (): Promise<void> => {
  try {
    console.log('🔍 Checking projects in database...');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/cpen321-project';
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connected successfully to ${uri}`);

    // Get database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get all projects directly from the collection
    const projectsCollection = db.collection('projects');
    const projects = await projectsCollection.find({}).toArray();
    console.log(`\n📊 Found ${projects.length} projects:\n`);

    projects.forEach((project: unknown, index: number) => {
      console.log(`Project ${index + 1}:`);
      console.log(`  ID: ${project._id}`);
      console.log(`  Name: ${project.name}`);
      console.log(`  Description: ${project.description}`);
      console.log(`  Owner ID: ${project.ownerId}`);
      console.log(`  Invitation Code: ${project.invitationCode}`);
      console.log(`  Members: ${project.members ? project.members.length : 0}`);
      console.log(`  Created: ${project.createdAt}`);
      console.log(`  Active: ${project.isActive}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking projects:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  checkProjects()
    .then(() => {
      console.log('🎉 Project check completed!');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('💥 Project check failed:', error);
      process.exit(1);
    });
}

export { checkProjects };
