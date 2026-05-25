import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin1234', 10);

  const admin = await prisma.officer.upsert({
    where: { email: 'admin@justiceflow.local' },
    update: {},
    create: {
      name: 'ผู้ดูแลระบบ',
      badgeNumber: 'ADMIN001',
      email: 'admin@justiceflow.local',
      passwordHash,
      role: Role.ADMIN,
      stationName: 'สำนักงานกลาง',
    },
  });

  console.log('Seeded admin officer:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
