-- AlterTable
ALTER TABLE "User"
ADD COLUMN "passwordResetFailureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "passwordResetLockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PasswordResetRequestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetRequestLog_mobileNumber_createdAt_idx" ON "PasswordResetRequestLog"("mobileNumber", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetRequestLog_userId_createdAt_idx" ON "PasswordResetRequestLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PasswordResetRequestLog" ADD CONSTRAINT "PasswordResetRequestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
