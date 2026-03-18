const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  try {
    const bunker = await db.bunker.findFirst({
      orderBy: { createdAt: 'desc' },
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
    
    // Safely log
    console.log("Bunker found:", bunker.id);
    console.log("Members count:", bunker.members.length);
    console.log("First member user:", JSON.stringify(bunker.members[0].user));
  } catch (err) {
    console.error("Prisma error:", err);
  }
}
main().finally(() => db.$disconnect());
