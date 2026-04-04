const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const bunkers = await db.bunker.findMany({ include: { members: true } });
  console.log(JSON.stringify(bunkers, null, 2));
}

main().finally(() => db.$disconnect());
