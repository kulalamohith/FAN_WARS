import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const VALID_ARMY_NAMES = ['CSK', 'RCB', 'MI', 'KKR', 'SRH', 'DC', 'PBKS', 'RR', 'LSG', 'GT'];

async function cleanup() {
  console.log('🛡️ Starting Army Data Cleanup...');

  // 1. Find all invalid armies
  const invalidArmies = await db.army.findMany({
    where: {
      name: { notIn: VALID_ARMY_NAMES },
    },
  });

  if (invalidArmies.length === 0) {
    console.log('✅ No invalid armies found. DB is clean!');
    return;
  }

  console.log(`📍 Found ${invalidArmies.length} invalid armies: ${invalidArmies.map(a => a.name).join(', ')}`);

  // 2. Ensure default army exists (RCB)
  let defaultArmy = await db.army.findUnique({ where: { name: 'RCB' } });
  if (!defaultArmy) {
    console.log('⚠️ RCB not found, falling back to CSK...');
    defaultArmy = await db.army.findUnique({ where: { name: 'CSK' } });
  }

  if (!defaultArmy) {
    throw new Error('❌ Could not find a valid default army (RCB or CSK) to migrate users to.');
  }

  // 3. Migrate users and delete invalid armies
  for (const army of invalidArmies) {
    console.log(`🔄 Processing ${army.name}...`);

    // Migrate users
    const updateCount = await db.user.updateMany({
      where: { armyId: army.id },
      data: { armyId: defaultArmy.id },
    });

    console.log(`   - Migrated ${updateCount.count} users to ${defaultArmy.name}`);

    // Update matches if any (home/away)
    await db.match.deleteMany({
      where: {
        OR: [{ homeArmyId: army.id }, { awayArmyId: army.id }],
      },
    });
    console.log('   - Cleared associated matches (if any)');

    // Delete the army
    await db.army.delete({ where: { id: army.id } });
    console.log(`✅ Deleted invalid army: ${army.name}`);
  }

  console.log('✨ Army Cleanup Complete!');
}

cleanup()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
