const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const courts = [
  {
    name: "Buena Vista",
    description: "4 reservable pickleball courts on Buena Vista Tennis Court #1. Players must bring their own net.",
    imageUrl: "/images/courts/buena-vista.jpg"
  },
  {
    name: "Goldman Tennis Center",
    description: "5 permanent pickleball courts at Golden Gate Park. State-of-the-art lighting on all courts. Modern facility includes players' lounge, locker rooms, and pro shop. Reservations required.",
    imageUrl: "/images/courts/goldman.jpg"
  },
  {
    name: "Jackson",
    description: "2 reservable pickleball courts on Jackson Tennis Court. Players must bring their own net. Can be reserved 2 days prior.",
    imageUrl: "/images/courts/jackson.jpg"
  },
  {
    name: "Moscone",
    description: "4 reservable pickleball courts. Courts E&F can be reserved 2 days prior. Permanent nets available.",
    imageUrl: "/images/courts/moscone.jpg"
  },
  {
    name: "Parkside Square",
    description: "8 reservable courts. Players must bring their own net. Courts G&H can be reserved 2 days prior.",
    imageUrl: "/images/courts/parkside.jpg"
  },
  {
    name: "Presidio Wall",
    description: "6 reservable pickleball courts available in one-hour slots.",
    imageUrl: "/images/courts/presidio.jpg"
  },
  {
    name: "Richmond",
    description: "2 pickleball courts on Richmond Tennis Court. Individual reservable courts available Monday through Friday 3-7 p.m. & weekends 10:30 a.m.-1:30 p.m. Court A can be reserved 2 days prior.",
    imageUrl: "/images/courts/richmond.jpg"
  },
  {
    name: "Rossi",
    description: "5 reservable pickleball courts with rolling nets available.",
    imageUrl: "/images/courts/rossi.jpg"
  },
  {
    name: "Stern Grove",
    description: "4 reservable pickleball courts at the Frances M. McAteer Tennis Courts. Beautiful park setting with convenient access to parking.",
    imageUrl: "/images/courts/stern.jpg"
  },
  {
    name: "Upper Noe",
    description: "2 pickleball courts on Upper Noe Tennis Court. Can be reserved 2 days prior.",
    imageUrl: "/images/courts/upper-noe.jpg"
  }
];

async function main() {
  try {
    // First delete all messages (due to foreign key constraints)
    await prisma.message.deleteMany();
    console.log('✓ Deleted all messages');

    // Delete all payment statuses
    await prisma.paymentStatus.deleteMany();
    console.log('✓ Deleted all payment statuses');

    // Delete all reservations
    await prisma.reservation.deleteMany();
    console.log('✓ Deleted all reservations');

    // Delete all courts
    await prisma.court.deleteMany();
    console.log('✓ Deleted all courts');

    // Create new courts
    for (const court of courts) {
      await prisma.court.create({
        data: court
      });
      console.log(`✓ Created court: ${court.name}`);
    }

    console.log('Successfully reset and reseeded courts data');
  } catch (error) {
    console.error('Error resetting courts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Error in main function:', e);
    process.exit(1);
  }); 