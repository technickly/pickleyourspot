import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to export`);

    // Write to a JSON file
    const exportPath = path.join(__dirname, 'users-backup.json');
    fs.writeFileSync(exportPath, JSON.stringify(users, null, 2));
    console.log(`✓ Exported users to ${exportPath}`);

  } catch (error) {
    console.error('Error exporting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportUsers(); 