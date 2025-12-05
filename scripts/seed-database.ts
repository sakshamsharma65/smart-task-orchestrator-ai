#!/usr/bin/env tsx
// Seed the database with initial data for testing
import { storage } from '../server/storage';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  console.log('🌱 Seeding database with initial data...');
  
  try {
    // 1. Create default admin user
    console.log('👤 Creating admin user...');
    const adminId = '12345678-1234-5678-9012-123456789012';
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      await storage.createUser({
        id: adminId,
        email: 'admin@example.com',
        user_name: 'System Administrator',
        department: 'IT',
        manager: null,
        phone: '+1-555-0100',
        is_admin: true,
        password_hash: hashedPassword,
      });
      console.log('✓ Created admin user: admin@example.com / admin123');
    } catch (error) {
      console.log('⚠️  Admin user already exists');
    }

    // 2. Create a sample team
    console.log('👥 Creating sample team...');
    const teamId = '11111111-1111-1111-1111-111111111111';
    try {
      await storage.createTeam({
        id: teamId,
        name: 'Development Team',
        description: 'Main development team',
        manager_id: adminId,
        department_id: null,
      });
      console.log('✓ Created sample team: Development Team');
    } catch (error) {
      console.log('⚠️  Sample team already exists');
    }

    // 3. Create sample users
    console.log('👥 Creating sample users...');
const sampleUsers = Array.from({ length: 34 }, (_, i) => {
  const userNumber = i + 3; // since user1 and user2 already exist
  return {
    id: crypto.randomUUID(),
    email: `user${userNumber}@example.com`,
    user_name: `User ${userNumber}`,
    department: 'IT',
    manager: 'admin@example.com',
    phone: `+1-555-${(1000 + userNumber).toString().padStart(4, '0')}`,
    is_admin: false,
  };
});

for (const user of sampleUsers) {
  try {
    const password = await bcrypt.hash('test@123', 10);
    await storage.createUser({
      ...user,
      password_hash: password,
    });
    console.log(`✓ Created user: ${user.email} / test@123`);
  } catch (error) {
    console.log(`⚠️  User ${user.email} already exists`);
  }
}

    for (const user of sampleUsers) {
      try {
        const password = await bcrypt.hash('password123', 10);
        await storage.createUser({
          ...user,
          password_hash: password,
        });
        console.log(`✓ Created user: ${user.email} / password123`);
      } catch (error) {
        console.log(`⚠️  User ${user.email} already exists`);
      }
    }

    // 4. Create sample tasks
    console.log('📋 Creating sample tasks...');
    const sampleTasks = [
      {
        id: '44444444-4444-4444-4444-444444444444',
        title: 'Setup Development Environment',
        description: 'Configure the development environment for the new project',
        priority: 1,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        estimated_hours: 4,
        status: 'in_progress',
        type: 'setup',
        created_by: adminId,
        assigned_to: '22222222-2222-2222-2222-222222222222',
        team_id: teamId,
        actual_completion_date: null,
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        title: 'Design User Interface',
        description: 'Create wireframes and mockups for the user interface',
        priority: 2,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        estimated_hours: 8,
        status: 'pending',
        type: 'design',
        created_by: adminId,
        assigned_to: '33333333-3333-3333-3333-333333333333',
        team_id: teamId,
        actual_completion_date: null,
      }
    ];

    for (const task of sampleTasks) {
      try {
        await storage.createTask(task);
        console.log(`✓ Created task: ${task.title}`);
      } catch (error) {
        console.log(`⚠️  Task ${task.title} already exists`);
      }
    }

    // 5. Create a sample task group
    console.log('📁 Creating sample task group...');
    try {
      await storage.createTaskGroup({
        id: '66666666-6666-6666-6666-666666666666',
        name: 'Project Setup',
        description: 'Initial project setup tasks',
        visibility: 'all_team_members',
        owner_id: adminId,
      });
      console.log('✓ Created task group: Project Setup');
    } catch (error) {
      console.log('⚠️  Task group already exists');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   User 1: john.doe@example.com / password123');
    console.log('   User 2: jane.smith@example.com / password123');
    console.log('');
    console.log('📊 Sample Data Created:');
    console.log('   • 3 Users (1 admin, 2 regular users)');
    console.log('   • 1 Team (Development Team)');
    console.log('   • 2 Tasks (Setup and Design)');
    console.log('   • 1 Task Group (Project Setup)');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();