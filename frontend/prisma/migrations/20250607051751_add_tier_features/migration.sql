-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('ACTIVE_RESERVATIONS', 'EMAIL_NOTIFICATIONS', 'CUSTOM_EVENTS', 'ENHANCED_COURTS', 'PRIORITY_SUPPORT', 'PAYMENT_TRACKING');

-- CreateTable
CREATE TABLE "TierFeature" (
    "id" TEXT NOT NULL,
    "type" "FeatureType" NOT NULL,
    "tier" "MembershipTier" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TierFeature_type_tier_key" ON "TierFeature"("type", "tier");
