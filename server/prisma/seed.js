import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Demo Admin',
      passwordHash,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@demo.com' },
    update: {},
    create: {
      email: 'member@demo.com',
      name: 'Demo Member',
      passwordHash,
    },
  });

  let project = await prisma.project.findFirst({ where: { name: 'Website Redesign' } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Revamp company website',
        members: {
          create: [
            { userId: admin.id, role: 'ADMIN' },
            { userId: member.id, role: 'MEMBER' },
          ],
        },
        tasks: {
          create: [
            {
              title: 'Design homepage mockup',
              status: 'IN_PROGRESS',
              dueDate: new Date(Date.now() - 86400000),
              assigneeId: member.id,
              createdById: admin.id,
            },
            {
              title: 'Set up CI pipeline',
              status: 'TODO',
              dueDate: new Date(Date.now() + 7 * 86400000),
              assigneeId: admin.id,
              createdById: admin.id,
            },
            {
              title: 'Write API documentation',
              status: 'DONE',
              createdById: admin.id,
            },
          ],
        },
      },
    });
  }

  console.log('Seed complete.');
  console.log('  admin@demo.com / password123 (Admin)');
  console.log('  member@demo.com / password123 (Member)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
