import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// Create a PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Singleton PrismaClient instance shared across all route files.
// Prevents connection pool exhaustion from multiple instances.
const prisma = new PrismaClient({ adapter });

export default prisma;
