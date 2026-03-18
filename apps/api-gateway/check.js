const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const db = new PrismaClient();
async function main() {
  const data = await db.bunker.findUnique({
    where: { id: "6c4f75a4-7a26-417c-93be-fb74ace6ec2a" },
    include: { members: true }
  });
  console.log("Bunker data: ", JSON.stringify(data, null, 2));
}
main().finally(() => db.$disconnect());
