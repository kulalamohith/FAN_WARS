/**
 * WARZONE — Badge Seed Script
 * Seeds the 6 core badges into the database.
 * Run with: npx tsx prisma/seed-badges.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CORE_BADGES = [
  {
    key: 'JINX_MASTER',
    name: 'Jinx Master',
    description: 'Land 50+ successful Jinx minigames in Live matches.',
    icon: '🎯',
    category: 'COMBAT',
    maxProgress: 50,
  },
  {
    key: 'GOAT_PREDICTOR',
    name: 'GOAT Predictor',
    description: '90%+ accuracy on micro-predictions over a season.',
    icon: '🐐',
    category: 'COMBAT',
    maxProgress: 100, // 100 predictions with 90%+ accuracy
  },
  {
    key: 'TOP_DEBATER',
    name: 'Top Debater',
    description: 'Win the most votes/jury decisions in Kangaroo Court tribunals.',
    icon: '⚖️',
    category: 'SOCIAL',
    maxProgress: 10,
  },
  {
    key: 'SNIPER_ACE',
    name: 'Sniper Ace',
    description: 'Win 20+ 1v1 Sniper Duels (Live or Callout mode).',
    icon: '🎯',
    category: 'COMBAT',
    maxProgress: 20,
  },
  {
    key: 'MEME_LORD',
    name: 'Meme Lord',
    description: 'Create and get 100+ shares on memes or Banter Cards in Posts.',
    icon: '😂',
    category: 'SOCIAL',
    maxProgress: 100,
  },
  {
    key: 'STREAK_COMMANDER',
    name: 'Streak Commander',
    description: 'Maintain a 30+ day Loyalty Streak without missing a day.',
    icon: '🔥',
    category: 'LOYALTY',
    maxProgress: 30,
  },
];

async function seed() {
  console.log('🎖️  Seeding badges...');

  for (const badge of CORE_BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        maxProgress: badge.maxProgress,
      },
      create: badge,
    });
    console.log(`  ✓ ${badge.icon} ${badge.name}`);
  }

  console.log(`\n✅ Seeded ${CORE_BADGES.length} badges successfully!`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
