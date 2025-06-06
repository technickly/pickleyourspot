const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting database cleanup...');

    // Delete all messages first (due to foreign key constraints)
    const deletedMessages = await prisma.message.deleteMany();
    console.log(`✓ Deleted ${deletedMessages.count} messages`);

    // Delete all payment statuses
    const deletedPayments = await prisma.paymentStatus.deleteMany();
    console.log(`✓ Deleted ${deletedPayments.count} payment statuses`);

    // Delete all reservations
    const deletedReservations = await prisma.reservation.deleteMany();
    console.log(`✓ Deleted ${deletedReservations.count} reservations`);

    console.log('Successfully cleaned up the database while preserving user data');
  } catch (error) {
    console.error('Error cleaning up the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main()
  .catch((e) => {
    console.error('Error in main function:', e);
    process.exit(1);
  }); 