import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First find the Carl Larsen court
    const court = await prisma.court.findFirst({
      where: {
        name: {
          contains: 'Carl Larsen',
          mode: 'insensitive'
        }
      }
    });

    if (!court) {
      console.log('❌ Carl Larsen court not found');
      return;
    }

    // Delete all messages in reservations for this court
    await prisma.message.deleteMany({
      where: {
        reservation: {
          courtId: court.id
        }
      }
    });
    console.log('✓ Deleted all messages for Carl Larsen court reservations');

    // Delete all reservations for this court
    await prisma.reservation.deleteMany({
      where: {
        courtId: court.id
      }
    });
    console.log('✓ Deleted all reservations for Carl Larsen court');

    // Finally delete the court itself
    await prisma.court.delete({
      where: {
        id: court.id
      }
    });
    console.log('✓ Deleted Carl Larsen court');

    console.log('Successfully removed Carl Larsen court and all related data');
  } catch (error) {
    console.error('Error deleting Carl Larsen court:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 