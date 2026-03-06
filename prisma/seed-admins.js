import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const supremeAdminPassword = await bcrypt.hash('Admin237#', 10);
  const adminPassword = await bcrypt.hash('admin247#', 10);

  // Supreme Admin
  const supremeAdmin = await prisma.user.upsert({
    where: { email: 'mukummudeh@gmail.com' },
    update: {
      password: supremeAdminPassword,
      role: 'SUPREME_ADMIN',
      isApproved: true,
      emailVerified: true,
    },
    create: {
      email: 'mukummudeh@gmail.com',
      username: 'Mudeh Mukum',
      password: supremeAdminPassword,
      role: 'SUPREME_ADMIN',
      isApproved: true,
      emailVerified: true,
      authProvider: 'local',
    },
  });

  console.log({ supremeAdmin });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'mukumwinston@gmail.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      isApproved: true,
      emailVerified: true,
    },
    create: {
      email: 'mukumwinston@gmail.com',
      username: 'Mukum Winston',
      password: adminPassword,
      role: 'ADMIN',
      isApproved: true,
      emailVerified: true,
      authProvider: 'local',
    },
  });

  console.log({ admin });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
