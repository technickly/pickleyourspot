const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function forceDeleteReservationsAndPayments() {
  try {
    console.log('🗑️  Starting forced deletion of reservations and payment statuses...')
    
    // Temporarily disable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`
    console.log('Foreign key checks disabled')

    // Truncate tables (faster than DELETE and resets auto-increment)
    console.log('Deleting payment statuses...')
    await prisma.$executeRaw`TRUNCATE TABLE PaymentStatus;`
    console.log('✓ Payment statuses deleted')

    console.log('Deleting reservations...')
    await prisma.$executeRaw`TRUNCATE TABLE Reservation;`
    console.log('✓ Reservations deleted')

    // Re-enable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`
    console.log('Foreign key checks re-enabled')

    console.log('✅ All reservations and payment statuses have been deleted!')
  } catch (error) {
    console.error('Error during deletion:', error)
    if (error.code) {
      console.error('Error code:', error.code)
    }
    if (error.meta) {
      console.error('Error metadata:', error.meta)
    }
    
    // Make sure to re-enable foreign key checks even if there's an error
    try {
      await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`
    } catch (e) {
      console.error('Error re-enabling foreign key checks:', e)
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

forceDeleteReservationsAndPayments() 