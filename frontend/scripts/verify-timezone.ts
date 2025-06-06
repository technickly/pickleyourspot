import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const prisma = new PrismaClient();

async function verifyTimeZone() {
  try {
    // Create a test date at 8 AM PT
    const testDate = new Date();
    testDate.setUTCHours(15, 0, 0, 0); // 8 AM PT = 15:00 UTC

    console.log('Time Zone Test Results:');
    console.log('----------------------');
    console.log('Test Date:', testDate.toISOString());
    console.log('Local Time:', format(testDate, 'yyyy-MM-dd HH:mm:ss'));
    console.log('PT Time:', formatInTimeZone(testDate, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm:ss'));
    console.log('UTC Time:', format(testDate, "yyyy-MM-dd HH:mm:ss 'UTC'"));
    
    // Test database time handling
    const testReservation = await prisma.reservation.create({
      data: {
        court: { 
          create: {
            name: 'Test Court',
            description: 'Test court for time zone verification',
            imageUrl: '/images/courts/test.jpg'
          }
        },
        startTime: testDate,
        endTime: new Date(testDate.getTime() + 3600000), // 1 hour later
        owner: {
          create: {
            email: 'test@example.com',
            name: 'Test User'
          }
        }
      }
    });

    console.log('\nDatabase Time Test:');
    console.log('------------------');
    console.log('Stored Start Time:', testReservation.startTime.toISOString());
    console.log('Retrieved in PT:', formatInTimeZone(testReservation.startTime, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm:ss'));

    // Clean up test data
    await prisma.reservation.delete({ where: { id: testReservation.id } });
    await prisma.court.deleteMany({ where: { name: 'Test Court' } });
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });

    console.log('\nTest completed and cleaned up successfully');
  } catch (error) {
    console.error('Error during time zone verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTimeZone(); 