import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...')
    
    // Delete all data in reverse order of dependencies
    // Keep users table untouched
    
    console.log('Deleting messages...')
    await prisma.message.deleteMany()
    
    console.log('Deleting reservations...')
    await prisma.reservation.deleteMany()
    
    console.log('Deleting courts...')
    await prisma.court.deleteMany()
    
    // Note: We're keeping all user data
    console.log('✅ Database cleaned successfully! (Users preserved)')
  } catch (error) {
    console.error('Error during cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase() 