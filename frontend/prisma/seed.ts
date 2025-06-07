import { PrismaClient, MembershipTier, FeatureType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing features
  await prisma.tierFeature.deleteMany();

  // Define tier features
  const tierFeatures = [
    // FREE Tier Features
    {
      tier: MembershipTier.FREE,
      type: FeatureType.ACTIVE_RESERVATIONS,
      value: JSON.stringify({ max: 3 }),
    },
    {
      tier: MembershipTier.FREE,
      type: FeatureType.EMAIL_NOTIFICATIONS,
      value: JSON.stringify({ enabled: false }),
    },
    {
      tier: MembershipTier.FREE,
      type: FeatureType.PAYMENT_TRACKING,
      value: JSON.stringify({ enabled: true, notifications: false }),
    },
    {
      tier: MembershipTier.FREE,
      type: FeatureType.CUSTOM_EVENTS,
      value: JSON.stringify({ enabled: false }),
    },
    {
      tier: MembershipTier.FREE,
      type: FeatureType.ENHANCED_COURTS,
      value: JSON.stringify({ enabled: false }),
    },
    {
      tier: MembershipTier.FREE,
      type: FeatureType.PRIORITY_SUPPORT,
      value: JSON.stringify({ enabled: false }),
    },

    // BASIC Tier Features
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.ACTIVE_RESERVATIONS,
      value: JSON.stringify({ max: 10 }),
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.EMAIL_NOTIFICATIONS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.PAYMENT_TRACKING,
      value: JSON.stringify({ enabled: true, notifications: true }),
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.CUSTOM_EVENTS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.ENHANCED_COURTS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.BASIC,
      type: FeatureType.PRIORITY_SUPPORT,
      value: JSON.stringify({ enabled: true, responseTime: 24 }),
    },

    // PREMIUM Tier Features (TBD)
    {
      tier: MembershipTier.PREMIUM,
      type: FeatureType.ACTIVE_RESERVATIONS,
      value: JSON.stringify({ max: null }), // Unlimited
    },
    {
      tier: MembershipTier.PREMIUM,
      type: FeatureType.EMAIL_NOTIFICATIONS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.PREMIUM,
      type: FeatureType.PAYMENT_TRACKING,
      value: JSON.stringify({ enabled: true, notifications: true }),
    },
    {
      tier: MembershipTier.PREMIUM,
      type: FeatureType.CUSTOM_EVENTS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.PREMIUM,
      type: FeatureType.ENHANCED_COURTS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.PREMIUM,
      type: FeatureType.PRIORITY_SUPPORT,
      value: JSON.stringify({ enabled: true, responseTime: 12 }),
    },

    // ADMIN Tier Features
    {
      tier: MembershipTier.ADMIN,
      type: FeatureType.ACTIVE_RESERVATIONS,
      value: JSON.stringify({ max: null }), // Unlimited
    },
    {
      tier: MembershipTier.ADMIN,
      type: FeatureType.EMAIL_NOTIFICATIONS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.ADMIN,
      type: FeatureType.PAYMENT_TRACKING,
      value: JSON.stringify({ enabled: true, notifications: true }),
    },
    {
      tier: MembershipTier.ADMIN,
      type: FeatureType.CUSTOM_EVENTS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.ADMIN,
      type: FeatureType.ENHANCED_COURTS,
      value: JSON.stringify({ enabled: true }),
    },
    {
      tier: MembershipTier.ADMIN,
      type: FeatureType.PRIORITY_SUPPORT,
      value: JSON.stringify({ enabled: true, responseTime: 1 }),
    },
  ];

  // Create all tier features
  for (const feature of tierFeatures) {
    await prisma.tierFeature.create({
      data: feature,
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
