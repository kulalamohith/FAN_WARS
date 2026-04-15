const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const user = await p.user.findFirst({
    where: { email: 'date07112004@gmail.com' }
  });
  console.log('User:', user);
  
  await p.$disconnect();
}
main();
