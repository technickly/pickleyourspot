const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deleteReservationsAndPayments() {
  try {
    console.log('🗑️  Starting deletion of reservations and payment statuses...')
    
    // Delete in correct order due to foreign key relationships
    // First delete payment statuses as they depend on reservations
    console.log('Deleting payment statuses...')
    await prisma.paymentStatus.deleteMany({
      where: {} // Delete all records
    })
    console.log('✓ Payment statuses deleted')

    // Then delete reservations
    console.log('Deleting reservations...')
    await prisma.reservation.deleteMany({
      where: {} // Delete all records
    })
    console.log('✓ Reservations deleted')

    console.log('✅ All reservations and payment statuses have been deleted!')
  } catch (error) {
    console.error('Error during deletion:', error)
    if (error.code) {
      console.error('Error code:', error.code)
    }
    if (error.meta) {
      console.error('Error metadata:', error.meta)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

deleteReservationsAndPayments() 