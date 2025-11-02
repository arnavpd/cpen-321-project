import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Hardcode connection for seeding
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
 * Seed the database with sample data to make collections visible in MongoDB Compass
 */
const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await connectDB();

    // Get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('📊 Adding sample data to collections...');

    // Get existing users to use their IDs for sample data
    const usersCollection = db.collection('users');
    const existingUsers = await usersCollection.find({}).limit(3).toArray();
    
    let userIds: unknown[] = [];
    
    if (existingUsers.length > 0) {
      console.log(`👥 Found ${existingUsers.length} existing users - using them for sample data`);
      userIds = existingUsers.map(user => user._id);
    } else {
      console.log('👥 Creating sample users...');
      const userInsertResult = await usersCollection.insertMany([
        {
          googleId: 'google_id_1',
          email: 'john.doe@example.com',
          name: 'John Doe',
          profilePicture: 'https://example.com/john.jpg',
          bio: 'Software developer passionate about project management',
          hobbies: ['programming', 'gaming', 'hiking'],
          ownedProjects: [],
          memberProjects: [],
          calendarEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          googleId: 'google_id_2',
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          profilePicture: 'https://example.com/jane.jpg',
          bio: 'UI/UX designer with a love for clean interfaces',
          hobbies: ['design', 'photography', 'cooking'],
          ownedProjects: [],
          memberProjects: [],
          calendarEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      userIds = Object.values(userInsertResult.insertedIds);
      console.log(`   ✅ Created ${userIds.length} users`);
    }

    // Add sample projects (always create them, even if users exist)
    const projectsCollection = db.collection('projects');
    const existingProjects = await projectsCollection.countDocuments();
    
    if (existingProjects === 0) {
      console.log('📁 Creating sample projects...');
      const projectInsertResult = await projectsCollection.insertMany([
        {
          name: 'Mobile App Development',
          description: 'Building a React Native app for task management',
          invitationCode: 'ABC12345',
          ownerId: userIds[0],
          members: [{
            userId: userIds[0],
            role: 'owner',
            joinedAt: new Date()
          }, {
            userId: userIds[1],
            role: 'user',
            joinedAt: new Date()
          }],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      const projectIds = Object.values(projectInsertResult.insertedIds);
      console.log(`   ✅ Created ${projectIds.length} projects`);

      // Add sample tasks
      const tasksCollection = db.collection('tasks');
      console.log('📝 Creating sample tasks...');
      await tasksCollection.insertMany([
        {
          projectId: projectIds[0],
          title: 'Design user interface mockups',
          description: 'Create wireframes and mockups for the main screens',
          status: 'in_progress',
          assignees: [userIds[1]],
          createdBy: userIds[0],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          projectId: projectIds[0],
          title: 'Set up development environment',
          description: 'Configure React Native development environment and dependencies',
          status: 'completed',
          assignees: [userIds[0]],
          createdBy: userIds[0],
          deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      console.log('   ✅ Created 2 tasks');

      // Add sample expenses
      const expensesCollection = db.collection('expenses');
      console.log('💰 Creating sample expenses...');
      await expensesCollection.insertMany([
        {
          projectId: projectIds[0],
          title: 'Team lunch meeting',
          description: 'Lunch during project planning session',
          amount: 120.50,
          createdBy: userIds[0],
          splits: [
            { userId: userIds[0], amount: 60.25, isPaid: true },
            { userId: userIds[1], amount: 60.25, isPaid: false }
          ],
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      console.log('   ✅ Created 1 expense');

      // Add sample chat messages
      const chatMessagesCollection = db.collection('chatmessages');
      console.log('💬 Creating sample chat messages...');
      await chatMessagesCollection.insertMany([
        {
          projectId: projectIds[0],
          content: 'Hey team, I\'ve completed the wireframes for the login screen!',
          messageType: 'text',
          senderId: userIds[1],
          senderName: 'Jane Smith',
          isDeleted: false,
          createdAt: new Date(Date.now() - 60 * 60 * 1000)
        },
        {
          projectId: projectIds[0],
          content: 'Great work Jane! The designs look fantastic. Let\'s review them in tomorrow\'s meeting.',
          messageType: 'text',
          senderId: userIds[0],
          senderName: 'John Doe',
          isDeleted: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000)
        }
      ]);
      console.log('   ✅ Created 2 chat messages');

      // Add sample notifications
      const notificationsCollection = db.collection('notifications');
      console.log('🔔 Creating sample notifications...');
      await notificationsCollection.insertMany([
        {
          userId: userIds[0],
          projectId: projectIds[0],
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: 'You have been assigned to "Design user interface mockups"',
          isRead: false,
          createdAt: new Date()
        },
        {
          userId: userIds[1],
          projectId: projectIds[0],
          type: 'expense_added',
          title: 'New Expense Added',
          message: 'John Doe added an expense: Team lunch meeting ($120.50)',
          isRead: true,
          createdAt: new Date()
        }
      ]);
      console.log('   ✅ Created 2 notifications');

      // Add sample project invitations
      const invitationsCollection = db.collection('projectinvitations');
      console.log('📧 Creating sample project invitations...');
      await invitationsCollection.insertMany([
        {
          projectId: projectIds[0],
          invitationCode: 'INV12345',
          invitedEmail: 'bob.wilson@example.com',
          invitedBy: userIds[0],
          role: 'user',
          status: 'pending',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ]);
      console.log('   ✅ Created 1 project invitation');
    } else {
      console.log('📊 Projects collection already has data, skipping project seeding...');
    }

    console.log('');
    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Collections that should now be visible in MongoDB Compass:');
    
    // Count documents in each collection
    const collections = ['users', 'projects', 'tasks', 'expenses', 'chatmessages', 'notifications', 'projectinvitations'];
    for (const collectionName of collections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`  - ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`  - ${collectionName}: 0 documents (collection may not exist yet)`);
      }
    }
    
    console.log('');
    console.log('🔍 Refresh MongoDB Compass to see all collections!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Database seeding script completed!');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('💥 Database seeding script failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };