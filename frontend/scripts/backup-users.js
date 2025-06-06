const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all users with their relationships
    const users = await prisma.user.findMany({
      include: {
        reservations: true,
        participants: true,
        messages: true,
        paymentStatuses: true
      }
    });

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Save to backup file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `users-backup-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(users, null, 2));

    console.log(`✓ Backed up ${users.length} users to ${backupPath}`);
  } catch (error) {
    console.error('Error backing up users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Error in main function:', e);
    process.exit(1);
  }); 