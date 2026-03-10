import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hash } from '@node-rs/argon2';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function isHashedPassword(password: string) {
  return password.startsWith('$argon2');
}

async function hashPassword(password: string) {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

async function main() {
  console.log('🔐 Backfilling plaintext user passwords to Argon2...');

  const users = await prisma.user.findMany({
    select: { id: true, email: true, password: true }
  });

  const plaintextUsers = users.filter((user) => !isHashedPassword(user.password));

  if (plaintextUsers.length === 0) {
    console.log('✅ No plaintext passwords found. Nothing to migrate.');
    return;
  }

  for (const user of plaintextUsers) {
    const hashedPassword = await hashPassword(user.password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    console.log(`✓ Migrated ${user.email}`);
  }

  console.log(`✅ Completed. Migrated ${plaintextUsers.length} user password(s).`);
}

main()
  .catch((error) => {
    console.error('❌ Password backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
