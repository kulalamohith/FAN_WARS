import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const armies = [
  { name: 'CSK', colorHex: '#FFFF3C' },
  { name: 'RCB', colorHex: '#EC1C24' },
  { name: 'MI', colorHex: '#004BA0' },
  { name: 'KKR', colorHex: '#2E0854' },
  { name: 'SRH', colorHex: '#F26522' },
  { name: 'DC', colorHex: '#00008B' },
  { name: 'PBKS', colorHex: '#ED1B24' },
  { name: 'RR', colorHex: '#EA1A85' },
  { name: 'LSG', colorHex: '#0057E2' },
  { name: 'GT', colorHex: '#1B2133' },
];

async function main() {
  console.log('Seeding WARZONE IPL Armies...');

  for (const army of armies) {
    await prisma.army.upsert({
      where: { name: army.name },
      update: {},
      create: {
        name: army.name,
        colorHex: army.colorHex,
      },
    });
  }

  // 2. Create a Live Match for Testing (RCB vs CSK)
  console.log('Spawning a Live Match (RCB vs CSK)...');
  const rcb = await prisma.army.findUnique({ where: { name: 'RCB' } });
  const csk = await prisma.army.findUnique({ where: { name: 'CSK' } });

  if (rcb && csk) {
    const liveMatch = await prisma.match.create({
      data: {
        homeArmyId: rcb.id,
        awayArmyId: csk.id,
        status: 'LIVE',
        startTime: new Date(),
        warRoom: {
          create: {
            toxicityScoreHome: 50,
            toxicityScoreAway: 50,
          }
        }
      }
    });
    console.log(`✅ Live Match created: ${liveMatch.id}`);
  }

  console.log('✅ Seeding complete. Armies and War Rooms ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
