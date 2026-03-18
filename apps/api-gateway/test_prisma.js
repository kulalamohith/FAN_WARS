const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const bunker = await db.bunker.findUnique({
    where: { id: "6c4f75a4-7a26-417c-93be-fb74ace6ec2a" },
    include: {
      match: { include: { homeArmy: true, awayArmy: true } },
      members: {
        include: {
          user: { select: { id: true, username: true, rank: true, army: true } }
        },
        orderBy: { joinedAt: 'asc' }
      }
    }
  });

  if (!bunker) {
    console.log("Not found"); return;
  }
  
  const creatorId = "0de5f486-2f74-4ee2-bb7e-6564e39743fd";
  const isMember = bunker.members.some((m) => m.userId === creatorId);
  console.log("Bunker found:", bunker.id);
  console.log("Members count:", bunker.members.length);
  console.log("IsMember evaluation:", isMember);
  console.log("First member struct:", JSON.stringify(bunker.members[0], null, 2));
}
main().finally(() => db.$disconnect());
