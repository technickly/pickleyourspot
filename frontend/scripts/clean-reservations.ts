import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanReservations() {
  try {
    // Delete all messages first (due to foreign key constraints)
    await prisma.message.deleteMany();
    console.log('✓ Deleted all messages');

    // Delete all reservations
    await prisma.reservation.deleteMany();
    console.log('✓ Deleted all reservations');

    console.log('Successfully cleaned up the database while preserving user data');
  } catch (error) {
    console.error('Error cleaning up the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanReservations(); 