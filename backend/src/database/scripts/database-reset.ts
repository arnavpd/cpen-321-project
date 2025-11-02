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
 * Force reseed: Clear all collections and add fresh sample data
 */
const forceReseed = async (): Promise<void> => {
  try {
    console.log('🔄 Starting force reseed...');
    console.log('⚠️  This will DELETE ALL existing data and add fresh sample data!');
    
    // Connect to MongoDB
    await connectDB();

    // Get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Clear all collections
    console.log('🗑️ Clearing all existing data...');
    const collections = ['users', 'projects', 'tasks', 'expenses', 'chatmessages', 'notifications', 'projectinvitations'];
    
    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).deleteMany({});
        console.log(`   ✅ Cleared ${collectionName}`);
      } catch (error) {
        console.log(`   ⚠️  Collection ${collectionName} doesn't exist yet`);
      }
    }

    console.log('\n🌱 Adding fresh sample data...');

    // Add sample users
    console.log('👥 Creating sample users...');
    const usersCollection = db.collection('users');
    const userInsertResult = await usersCollection.insertMany([
      {
        googleId: 'sample_google_id_1',
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
        googleId: 'sample_google_id_2',
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
      },
      {
        googleId: 'sample_google_id_3',
        email: 'mike.wilson@example.com',
        name: 'Mike Wilson',
        profilePicture: 'https://example.com/mike.jpg',
        bio: 'Full-stack developer and team lead',
        hobbies: ['coding', 'music', 'sports'],
        ownedProjects: [],
        memberProjects: [],
        calendarEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    const userIds = Object.values(userInsertResult.insertedIds);
    console.log(`   ✅ Created ${userIds.length} users`);

    // Add sample projects
    console.log('📁 Creating sample projects...');
    const projectsCollection = db.collection('projects');
    const projectInsertResult = await projectsCollection.insertMany([
      {
        name: 'Mobile App Development',
        description: 'Building a React Native app for task management',
        invitationCode: 'MOBILE01',
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
      },
      {
        name: 'Website Redesign',
        description: 'Modernizing company website with new UI/UX',
        invitationCode: 'WEBSITE1',
        ownerId: userIds[2],
        members: [{
          userId: userIds[2],
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
    console.log('📝 Creating sample tasks...');
    const tasksCollection = db.collection('tasks');
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
      },
      {
        projectId: projectIds[1],
        title: 'Create homepage wireframe',
        description: 'Design the new homepage layout and structure',
        status: 'not_started',
        assignees: [userIds[1]],
        createdBy: userIds[2],
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        projectId: projectIds[1],
        title: 'Research competitor websites',
        description: 'Analyze competitor websites for inspiration and best practices',
        status: 'in_progress',
        assignees: [userIds[2]],
        createdBy: userIds[2],
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('   ✅ Created 4 tasks');

    // Add sample expenses
    console.log('💰 Creating sample expenses...');
    const expensesCollection = db.collection('expenses');
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
      },
      {
        projectId: projectIds[1],
        title: 'Software licenses',
        description: 'Adobe Creative Suite licenses for design work',
        amount: 299.99,
        createdBy: userIds[2],
        splits: [
          { userId: userIds[2], amount: 199.99, isPaid: true },
          { userId: userIds[1], amount: 100.00, isPaid: false }
        ],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('   ✅ Created 2 expenses');

    // Add sample chat messages
    console.log('💬 Creating sample chat messages...');
    const chatMessagesCollection = db.collection('chatmessages');
    await chatMessagesCollection.insertMany([
      {
        projectId: projectIds[0],
        content: 'Hey team, I\'ve completed the wireframes for the login screen!',
        messageType: 'text',
        senderId: userIds[1],
        senderName: 'Jane Smith',
        isDeleted: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        projectId: projectIds[0],
        content: 'Great work Jane! The designs look fantastic. Let\'s review them in tomorrow\'s meeting.',
        messageType: 'text',
        senderId: userIds[0],
        senderName: 'John Doe',
        isDeleted: false,
        createdAt: new Date(Date.now() - 90 * 60 * 1000)
      },
      {
        projectId: projectIds[1],
        content: 'Starting research on competitor websites. Will share findings by end of week.',
        messageType: 'text',
        senderId: userIds[2],
        senderName: 'Mike Wilson',
        isDeleted: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000)
      }
    ]);
    console.log('   ✅ Created 3 chat messages');

    // Add sample notifications
    console.log('🔔 Creating sample notifications...');
    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.insertMany([
      {
        userId: userIds[1],
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
      },
      {
        userId: userIds[1],
        projectId: projectIds[1],
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned to "Create homepage wireframe"',
        isRead: false,
        createdAt: new Date()
      }
    ]);
    console.log('   ✅ Created 3 notifications');

    // Add sample project invitations
    console.log('📧 Creating sample project invitations...');
    const invitationsCollection = db.collection('projectinvitations');
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
      },
      {
        projectId: projectIds[1],
        invitationCode: 'INV67890',
        invitedEmail: 'sarah.jones@example.com',
        invitedBy: userIds[2],
        role: 'user',
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('   ✅ Created 2 project invitations');

    console.log('\n✅ Force reseed completed successfully!');
    console.log('📊 Fresh sample data added:');
    console.log('  - users: 3 sample users');
    console.log('  - projects: 2 projects');
    console.log('  - tasks: 4 tasks');
    console.log('  - expenses: 2 expenses');
    console.log('  - chatmessages: 3 messages');
    console.log('  - notifications: 3 notifications');
    console.log('  - projectinvitations: 2 invitations');
    console.log('\n🔍 Refresh MongoDB Compass to see all collections with fresh data!');
    
  } catch (error) {
    console.error('❌ Force reseed failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  forceReseed()
    .then(() => {
      console.log('\n🎉 Force reseed script completed!');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('💥 Force reseed script failed:', error);
      process.exit(1);
    });
}

export { forceReseed };