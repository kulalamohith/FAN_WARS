-- PostgreSQL PRO Schema Migration

-- CreateTable
CREATE TABLE "armies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "colorHex" VARCHAR(7) NOT NULL,
    "seasonScore" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "armies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "armyId" UUID NOT NULL,
    "rank" VARCHAR(30) NOT NULL DEFAULT 'Recruit',
    "totalWarPoints" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "homeArmyId" UUID NOT NULL,
    "awayArmyId" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PRE',
    "startTime" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "war_rooms" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "toxicityScoreHome" INTEGER NOT NULL DEFAULT 0,
    "toxicityScoreAway" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "war_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" VARCHAR(100) NOT NULL,
    "optionB" VARCHAR(100) NOT NULL,
    "correctOption" CHAR(1),
    "pointsReward" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_ledger" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "predictionId" UUID NOT NULL,
    "selectedOption" CHAR(1) NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "clientIp" INET,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "armies_name_key" ON "armies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE INDEX "users_armyId_idx" ON "users"("armyId");

-- CreateIndex
CREATE INDEX "users_totalWarPoints_idx" ON "users"("totalWarPoints" DESC);

-- CreateIndex
CREATE INDEX "users_isActive_deletedAt_idx" ON "users"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "matches_status_startTime_idx" ON "matches"("status", "startTime");

-- CreateIndex
CREATE INDEX "matches_homeArmyId_awayArmyId_idx" ON "matches"("homeArmyId", "awayArmyId");

-- CreateIndex
CREATE UNIQUE INDEX "war_rooms_matchId_key" ON "war_rooms"("matchId");

-- CreateIndex
CREATE INDEX "predictions_matchId_status_idx" ON "predictions"("matchId", "status");

-- CreateIndex
CREATE INDEX "prediction_ledger_userId_idx" ON "prediction_ledger"("userId");

-- CreateIndex
CREATE INDEX "prediction_ledger_predictionId_selectedOption_idx" ON "prediction_ledger"("predictionId", "selectedOption");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_ledger_userId_predictionId_key" ON "prediction_ledger"("userId", "predictionId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_armyId_fkey" FOREIGN KEY ("armyId") REFERENCES "armies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeArmyId_fkey" FOREIGN KEY ("homeArmyId") REFERENCES "armies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayArmyId_fkey" FOREIGN KEY ("awayArmyId") REFERENCES "armies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "war_rooms" ADD CONSTRAINT "war_rooms_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_ledger" ADD CONSTRAINT "prediction_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_ledger" ADD CONSTRAINT "prediction_ledger_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
