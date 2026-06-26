// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Пул підключень до Supabase (SESSION POOLER URI)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // для Supabase зазвичай потрібно
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // <-- головне для Prisma 7
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
