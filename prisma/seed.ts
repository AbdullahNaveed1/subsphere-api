import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { code: 'FREE',     name: 'Free',     priceCents: 0,       interval: 'month' },
    { code: 'STARTER',  name: 'Starter',  priceCents: 900000,  interval: 'month' },
    { code: 'PRO',      name: 'Pro',      priceCents: 2900000, interval: 'month' },
    { code: 'BUSINESS', name: 'Business', priceCents: 9900000, interval: 'month' },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {},
      create: plan,
    });
  }

  console.log('✅ Seeded 4 plans');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });