import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearReservations() {
  try {
    console.log('Starting reservation cleanup...');

    // First, delete all messages (they reference reservations)
    console.log('Deleting messages...');
    await prisma.message.deleteMany();

    // Delete all participant statuses
    console.log('Deleting participant statuses...');
    await prisma.ParticipantStatus.deleteMany();

    // Finally, delete all reservations
    console.log('Deleting reservations...');
    await prisma.reservation.deleteMany();

    console.log('Successfully deleted all reservations and related data.');
    console.log('User data has been preserved.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearReservations(); 