import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if any data exists
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  console.log("Database seeded successfully (no initial data required).");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
