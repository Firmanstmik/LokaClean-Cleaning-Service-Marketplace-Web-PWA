-- Add password hash for USER authentication (bcrypt).
-- Keep nullable to avoid breaking existing rows; new registrations will set this field.

ALTER TABLE "User" ADD COLUMN "password_hash" TEXT;


