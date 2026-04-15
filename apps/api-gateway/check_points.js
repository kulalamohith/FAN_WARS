BigInt.prototype.toJSON = function() { return Number(this); };
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const user = await p.user.findFirst({
    where: { username: 'mumbai_ka_raja' },
    select: { totalWarPoints: true, loginStreak: true, lastLoginAt: true, username: true }
  });
  console.log('User:', JSON.stringify(user, null, 2));
  
  const totalEntries = await p.pointsLog.count();
  console.log('Total PointsLog entries:', totalEntries);
  
  await p.$disconnect();
}
main();
