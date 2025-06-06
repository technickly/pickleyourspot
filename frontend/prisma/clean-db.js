const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...')
    
    // Use a transaction to ensure all operations succeed or none do
    await prisma.$transaction(async (tx) => {
      // Delete all data in reverse order of dependencies
      // Keep users table untouched
      
      console.log('Deleting messages...')
      await tx.message.deleteMany({
        where: {} // explicit where clause
      })
      
      console.log('Deleting reservations...')
      await tx.reservation.deleteMany({
        where: {} // explicit where clause
      })
      
      console.log('Deleting courts...')
      await tx.court.deleteMany({
        where: {} // explicit where clause
      })
    }, {
      timeout: 10000 // 10 second timeout
    })
    
    // Note: We're keeping all user data
    console.log('✅ Database cleaned successfully! (Users preserved)')
  } catch (error) {
    console.error('Error during cleanup:', error)
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

cleanDatabase() 