-- campus column is already nullable in the database.
-- This migration only updates the Prisma schema to mark it as optional (SchoolCampus?)
-- so that DIRECTOR-level users who oversee all campuses can have a NULL campus value.
SELECT 1;
