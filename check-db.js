import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const postCount = await prisma.post.count();
  const userCount = await prisma.user.count();
  const posts = await prisma.post.findMany({
    include: {
      user: {
        select: { username: true },
      },
    },
  });

  console.log('Post Count:', postCount);
  console.log('User Count:', userCount);
  console.log('Posts:', JSON.stringify(posts, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
