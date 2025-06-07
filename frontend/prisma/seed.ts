/* eslint-disable @typescript-eslint/no-var-requires */
import { PrismaClient, MembershipTier, FeatureType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete existing data
  await prisma.tierFeature.deleteMany();
  await prisma.membership.deleteMany();

  // Create tier features
  const features = [
    // FREE tier features
    {
      tier: MembershipTier.FREE,
      type: FeatureType.ACTIVE_RESERVATIONS,
      value: '3',
      description: 'Maximum number of active reservations',
    },
    {
      tier: MembershipTier.FREE,
      type: FeatureType.PARTICIPANT_MANAGEMENT,
      value: 'basic',
      description: 'Basic participant management',
    },
    {
      tier: MembershipTier.FREE,
      type: FeatureType.PAYMENT_TRACKING,
      value: 'basic',
      description: 'Basic payment tracking without notifications',
    },
    {
      tier: MembershipTier.FREE,
      type: FeatureType.COURT_ACCESS,
      value: 'public',
      description: 'Access to public courts only',
    },

    // BASIC tier features
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.ACTIVE_RESERVATIONS,
      value: '10',
      description: 'Maximum number of active reservations',
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.CUSTOM_EVENTS,
      value: 'enabled',
      description: 'Create and manage custom events and tournaments',
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.COURT_MANAGEMENT,
      value: 'enhanced',
      description: 'Enhanced court management capabilities',
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.PAYMENT_NOTIFICATIONS,
      value: 'email',
      description: 'Email payment reminders',
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.SUPPORT,
      value: '24h',
      description: '24-hour priority support',
    },

    // SUPR tier features (Coming Soon)
    {
      tier: MembershipTier.SUPR,
      type: FeatureType.COMING_SOON,
      value: 'true',
      description: 'Supr features coming soon',
    },

    // ADMIN tier features
    {
      tier: MembershipTier.ADMIN,
      type: FeatureType.SYSTEM_ACCESS,
      value: 'full',
      description: 'Full system access for administrators',
    },
  ];

  for (const feature of features) {
    await prisma.tierFeature.create({
      data: feature,
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

