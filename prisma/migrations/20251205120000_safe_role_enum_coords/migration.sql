-- Safely convert role to enum and add event coordinates without data loss.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
  END IF;
END$$;

-- Convert existing role to enum only if it's not already Role.
DO $$
DECLARE
  col_udt text;
BEGIN
  SELECT udt_name INTO col_udt
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'role';

  IF col_udt IS NULL THEN
    RAISE NOTICE 'Column "role" not found on table "User"';
    RETURN;
  END IF;

  IF col_udt <> 'Role' THEN
    ALTER TABLE "User"
      ALTER COLUMN "role" TYPE "Role"
        USING (CASE LOWER("role"::text) WHEN 'admin' THEN 'ADMIN' ELSE 'USER' END),
      ALTER COLUMN "role" SET DEFAULT 'USER';
  ELSE
    ALTER TABLE "User"
      ALTER COLUMN "role" SET DEFAULT 'USER';
  END IF;
END$$;

-- Add coordinates to Event if missing.
ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
