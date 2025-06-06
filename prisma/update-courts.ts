import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Updated court information
  const courts = [
    {
      name: 'Carl Larsen Tennis Courts',
      description: 'Recently renovated courts with new surfacing and lighting. Features include 6 hard courts, practice wall, bathroom facilities, water fountains, shaded seating areas, and equipment rental. Perfect for both casual play and organized events.',
      imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop&q=80',
    },
    {
      name: 'Stern Grove Tennis Courts',
      description: 'Historic courts nestled in the beautiful Stern Grove park. Four well-maintained courts available through SF Rec & Parks. Features include new LED lighting for evening play, ample parking, picnic areas, and stunning surroundings. Official reservations at sfrecpark.org.',
      imageUrl: 'https://images.unsplash.com/photo-1622163642998-1ea32e539f77?w=800&h=600&fit=crop&q=80',
    },
    {
      name: 'Goldman Tennis Center',
      description: 'Premium tennis facility featuring 6 indoor and 8 outdoor courts. State-of-the-art amenities include climate-controlled indoor courts, pro shop, locker rooms, and café. Available for $25/hour with discounts for members. Night lighting and covered seating available. Dedicated parking lot on-site.',
      imageUrl: 'https://images.unsplash.com/photo-1614743758466-e569f4791116?w=800&h=600&fit=crop&q=80',
    },
  ];

  console.log('Starting court updates...');

  // Update each court
  for (const courtData of courts) {
    const updatedCourt = await prisma.court.updateMany({
      where: {
        name: {
          contains: courtData.name.split(' ')[0], // Match on first word of name
        },
      },
      data: courtData,
    });
    
    console.log(`Updated court: ${courtData.name}`);
  }

  console.log('Court updates completed successfully');
}

main()
  .catch((e) => {
    console.error('Error updating courts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 