const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const duels = await db.sniperDuel.findMany({
    where: { 
      OR: [
        { player1Army: 'Rival' },
        { player2Army: 'Rival' }
      ]
    }
  });

  console.log(`Found ${duels.length} duels with 'Rival' placeholder.`);

  let updated = 0;
  for (const duel of duels) {
    let updateData = {};

    if (duel.player1Army === 'Rival') {
      const u = await db.user.findUnique({ where: { id: duel.player1Id }, include: { army: true } });
      if (u && u.army) {
        updateData.player1Army = u.army.name;
        updateData.player1Color = u.army.colorHex;
      }
    }

    if (duel.player2Army === 'Rival') {
      const u = await db.user.findUnique({ where: { id: duel.player2Id }, include: { army: true } });
      if (u && u.army) {
        updateData.player2Army = u.army.name;
        updateData.player2Color = u.army.colorHex;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.sniperDuel.update({
        where: { id: duel.id },
        data: updateData
      });
      updated++;
    }
  }

  console.log(`Updated ${updated} duels.`);
}

main().catch(console.error).finally(() => db.$disconnect());
