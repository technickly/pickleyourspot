const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function forceCleanDatabase() {
  try {
    console.log('🗑️  Starting forced database cleanup...')
    
    // Disable foreign key checks temporarily
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`
    
    console.log('Foreign key checks disabled...')
    
    // Delete all data except users
    console.log('Deleting messages...')
    await prisma.$executeRaw`TRUNCATE TABLE Message;`
    
    console.log('Deleting reservations...')
    await prisma.$executeRaw`TRUNCATE TABLE Reservation;`
    
    console.log('Deleting courts...')
    await prisma.$executeRaw`TRUNCATE TABLE Court;`
    
    // Re-enable foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`
    
    console.log('Foreign key checks re-enabled...')
    
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

forceCleanDatabase() 