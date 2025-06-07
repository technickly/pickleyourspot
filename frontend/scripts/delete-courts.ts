import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete related records first
    console.log('Deleting related records...');
    
    // Delete messages
    await prisma.message.deleteMany({
      where: {
        reservation: {
          court: {
            id: { not: '' }  // matches all courts
          }
        }
      }
    });
    console.log('✓ Deleted all related messages');

    // Delete participant statuses
    await prisma.participantStatus.deleteMany({
      where: {
        reservation: {
          court: {
            id: { not: '' }
          }
        }
      }
    });
    console.log('✓ Deleted all participant statuses');

    // Delete reservations
    await prisma.reservation.deleteMany({
      where: {
        court: {
          id: { not: '' }
        }
      }
    });
    console.log('✓ Deleted all reservations');

    // Finally, delete all courts
    await prisma.court.deleteMany();
    console.log('✓ Deleted all courts');

    // Verify deletion
    const remainingCourts = await prisma.court.count();
    console.log(`Verification: ${remainingCourts} courts remaining`);

  } catch (error) {
    console.error('Error deleting courts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 