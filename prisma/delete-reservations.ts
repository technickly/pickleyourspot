import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First delete all messages as they depend on reservations
    await prisma.message.deleteMany();
    console.log('✓ Deleted all messages');

    // Delete all reservations
    await prisma.reservation.deleteMany();
    console.log('✓ Deleted all reservations');

    console.log('Successfully deleted all reservations and related data');
  } catch (error) {
    console.error('Error deleting reservations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 