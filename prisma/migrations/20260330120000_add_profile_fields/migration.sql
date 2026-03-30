-- AlterTable
ALTER TABLE "User"
ADD COLUMN "displayName" TEXT,
ADD COLUMN "tagline" TEXT,
ADD COLUMN "avatarColor" TEXT DEFAULT '#16a34a',
ADD COLUMN "accountClaimed" BOOLEAN NOT NULL DEFAULT false;
