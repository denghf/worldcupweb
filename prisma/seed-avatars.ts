import { prisma } from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    where: { avatar: null },
    select: { id: true, username: true },
  });

  console.log(`Found ${users.length} users without avatar`);

  for (const user of users) {
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.username)}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar },
    });
    console.log(`Updated ${user.username}: ${avatar}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
