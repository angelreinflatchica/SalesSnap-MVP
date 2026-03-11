-- Rename User.email to User.mobileNumber while preserving existing values.
DROP INDEX IF EXISTS "User_email_key";
ALTER TABLE "User" RENAME COLUMN "email" TO "mobileNumber";
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "User"("mobileNumber");
