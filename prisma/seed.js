// prisma/seed.js
import bcrypt from 'bcrypt';
import prisma from '../src/lib/prisma.js';

async function main() {
  // Clear all users (optional, useful for testing)
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@realestate.com',
      username: 'admin',
      password: hashedPassword,
      avatar: null,
    },
    {
      email: 'user1@realestate.com',
      username: 'user1',
      password: hashedPassword,
      avatar: null,
    },
  ];

  for (const user of users) {
    await prisma.user.create({ data: user });
  }
}

main()
  .catch(e => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
