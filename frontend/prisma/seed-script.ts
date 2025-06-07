import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type MembershipTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ADMIN';

async function main() {
  // Delete existing data
  await prisma.membershipFeature.deleteMany();
  await prisma.membership.deleteMany();

  // Create membership features
  const features: Array<{
    name: string;
    description: string;
    tiers: MembershipTier[];
  }> = [
    // FREE tier features
    {
      name: 'active_reservations_free',
      description: 'Maximum of 3 active reservations',
      tiers: ['FREE'],
    },
    {
      name: 'basic_participant_management',
      description: 'Basic participant management capabilities',
      tiers: ['FREE', 'BASIC', 'PREMIUM', 'ADMIN'],
    },
    {
      name: 'basic_payment_tracking',
      description: 'Basic payment tracking without notifications',
      tiers: ['FREE'],
    },
    {
      name: 'public_courts_only',
      description: 'Access to public courts only',
      tiers: ['FREE'],
    },

    // BASIC tier features
    {
      name: 'active_reservations_basic',
      description: 'Maximum of 10 active reservations',
      tiers: ['BASIC'],
    },
    {
      name: 'custom_events',
      description: 'Create and manage custom events and tournaments',
      tiers: ['BASIC', 'PREMIUM', 'ADMIN'],
    },
    {
      name: 'enhanced_court_management',
      description: 'Enhanced court management capabilities',
      tiers: ['BASIC', 'PREMIUM', 'ADMIN'],
    },
    {
      name: 'email_payment_reminders',
      description: 'Email payment reminders',
      tiers: ['BASIC', 'PREMIUM', 'ADMIN'],
    },
    {
      name: 'priority_support_24h',
      description: '24-hour priority support',
      tiers: ['BASIC'],
    },

    // PREMIUM tier features
    {
      name: 'unlimited_reservations',
      description: 'Unlimited active reservations',
      tiers: ['PREMIUM', 'ADMIN'],
    },
    {
      name: 'priority_support_12h',
      description: '12-hour priority support',
      tiers: ['PREMIUM'],
    },

    // ADMIN tier features
    {
      name: 'full_system_access',
      description: 'Full system access for administrators',
      tiers: ['ADMIN'],
    },
    {
      name: 'instant_support',
      description: 'Instant priority support',
      tiers: ['ADMIN'],
    },
  ];

  for (const feature of features) {
    await prisma.membershipFeature.create({
      data: {
        name: feature.name,
        description: feature.description,
        tiers: feature.tiers,
      },
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 