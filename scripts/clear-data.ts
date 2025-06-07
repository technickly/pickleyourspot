import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('Starting data cleanup...\n');

    // First, delete messages (they reference both users and reservations)
    console.log('Deleting messages...');
    const deletedMessages = await prisma.message.deleteMany();
    console.log(`✓ Deleted ${deletedMessages.count} messages`);

    // Delete participant statuses
    console.log('\nDeleting participant statuses...');
    const deletedStatuses = await prisma.ParticipantStatus.deleteMany();
    console.log(`✓ Deleted ${deletedStatuses.count} participant statuses`);

    // Delete reservations
    console.log('\nDeleting reservations...');
    const deletedReservations = await prisma.reservation.deleteMany();
    console.log(`✓ Deleted ${deletedReservations.count} reservations`);

    // Finally, delete users
    console.log('\nDeleting users...');
    const deletedUsers = await prisma.user.deleteMany();
    console.log(`✓ Deleted ${deletedUsers.count} users`);

    // Verify courts remain
    const remainingCourts = await prisma.court.count();
    console.log(`\n✅ Operation complete. ${remainingCourts} courts preserved.`);

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Add confirmation prompt
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This script will delete all users, reservations, and messages.');
console.log('Courts data will be preserved.');
console.log('This action cannot be undone.\n');

readline.question('Please type \'CONFIRM\' to proceed: ', (answer) => {
  if (answer === 'CONFIRM') {
    clearData();
  } else {
    console.log('Operation cancelled.');
    process.exit(0);
  }
  readline.close();
}); 