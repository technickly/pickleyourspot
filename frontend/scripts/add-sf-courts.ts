const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const courts = [
  {
    name: "Goldman Tennis Center",
    description: "8 dedicated pickleball courts with permanent nets. Professional facility with lights for night play, restrooms, and pro shop. Courts can be reserved up to 7 days in advance.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,goldman"
  },
  {
    name: "Stern Grove",
    description: "4 pickleball courts with permanent nets. Beautiful outdoor setting surrounded by eucalyptus trees. Courts available on first-come, first-served basis during park hours.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,grove"
  },
  {
    name: "Buena Vista",
    description: "4 reservable pickleball courts on Buena Vista Tennis Court #1. Players must bring their own net.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,1"
  },
  {
    name: "Jackson",
    description: "2 reservable pickleball courts on Jackson Tennis Court. Players must bring their own net. Can be reserved 2 days prior.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,2"
  },
  {
    name: "Moscone",
    description: "4 reservable pickleball courts. Courts E&F can be reserved 2 days prior. Permanent nets available.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,3"
  },
  {
    name: "Parkside Square",
    description: "8 reservable courts. Players must bring their own net. Courts G&H can be reserved 2 days prior.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,4"
  },
  {
    name: "Presidio Wall",
    description: "6 reservable pickleball courts available in one-hour slots.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,5"
  },
  {
    name: "Richmond",
    description: "2 pickleball courts on Richmond Tennis Court. Individual reservable courts available Monday through Friday 3-7 p.m. & weekends 10:30 a.m.-1:30 p.m. Court A can be reserved 2 days prior.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,6"
  },
  {
    name: "Rossi",
    description: "5 reservable pickleball courts with rolling nets available.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,7"
  },
  {
    name: "Upper Noe",
    description: "2 pickleball courts on Upper Noe Tennis Court. Can be reserved 2 days prior.",
    imageUrl: "https://source.unsplash.com/random/800x600/?pickleball,court,8"
  }
];

async function main() {
  console.log('Starting to add courts...');

  for (const court of courts) {
    try {
      const existingCourt = await prisma.court.findFirst({
        where: { name: court.name }
      });

      if (existingCourt) {
        console.log(`Court ${court.name} already exists, updating...`);
        await prisma.court.update({
          where: { id: existingCourt.id },
          data: court
        });
      } else {
        console.log(`Adding new court: ${court.name}`);
        await prisma.court.create({
          data: court
        });
      }
    } catch (error) {
      console.error(`Error processing court ${court.name}:`, error);
    }
  }

  console.log('Finished adding courts!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 