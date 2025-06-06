import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importUsers() {
  try {
    // Read the backup file
    const backupPath = path.join(__dirname, 'users-backup.json');
    const usersData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`Found ${usersData.length} users to import`);

    // Import each user using upsert to avoid duplicates
    for (const user of usersData) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          image: user.image,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
    console.log('✓ Successfully imported all users');

  } catch (error) {
    console.error('Error importing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importUsers(); 