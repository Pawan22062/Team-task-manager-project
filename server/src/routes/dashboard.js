import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const projectIds = (
    await prisma.projectMember.findMany({
      where: { userId: req.userId },
      select: { projectId: true },
    })
  ).map((m) => m.projectId);

  const now = new Date();

  const [tasks, statusCounts, overdueCount, projectCount] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
      take: 20,
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: true,
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: 'DONE' },
      },
    }),
    prisma.project.count({
      where: { members: { some: { userId: req.userId } } },
    }),
  ]);

  const myTasks = await prisma.task.count({
    where: { projectId: { in: projectIds }, assigneeId: req.userId },
  });

  const byStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const row of statusCounts) {
    byStatus[row.status] = row._count;
  }

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < now && t.status !== 'DONE'
  );

  res.json({
    summary: {
      projectCount,
      totalTasks: byStatus.TODO + byStatus.IN_PROGRESS + byStatus.DONE,
      myAssignedTasks: myTasks,
      overdueCount,
      byStatus,
    },
    recentTasks: tasks,
    overdueTasks: overdueTasks.slice(0, 10),
  });
});

export default router;
