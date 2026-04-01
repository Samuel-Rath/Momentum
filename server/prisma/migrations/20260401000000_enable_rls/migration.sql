-- Enable Row Level Security on all public tables.
-- The postgres/service_role bypasses RLS, so Prisma (backend) is unaffected.
-- This blocks the PostgREST auto-API (anon/authenticated roles) from accessing
-- these tables directly, resolving the Supabase security warnings.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Habit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HabitLog" ENABLE ROW LEVEL SECURITY;
