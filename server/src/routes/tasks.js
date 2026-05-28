import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  authenticate,
  requireProjectMember,
  requireTaskAccess,
} from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTaskValidation, updateTaskValidation } from '../validators/task.js';

const router = Router();

router.use(authenticate);

router.get(
  '/projects/:id/tasks',
  requireProjectMember,
  async (req, res) => {
    const { status, assigneeId, overdue } = req.query;
    const where = { projectId: req.params.id };

    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'DONE' };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
    });

    res.json({ tasks });
  }
);

router.post(
  '/projects/:id/tasks',
  requireProjectMember,
  createTaskValidation,
  validate,
  async (req, res) => {
    const { title, description, status, dueDate, assigneeId } = req.body;

    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: { userId: assigneeId, projectId: req.params.id },
        },
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'TODO',
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
        projectId: req.params.id,
        createdById: req.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ task });
  }
);

router.get('/:id', requireTaskAccess, async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });
  res.json({ task });
});

router.patch('/:id', requireTaskAccess, updateTaskValidation, validate, async (req, res) => {
  const { title, description, status, dueDate, assigneeId } = req.body;
  const data = {};

  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (status !== undefined) data.status = status;
  if (dueDate !== undefined) data.dueDate = dueDate;
  if (assigneeId !== undefined) {
    if (assigneeId === null) {
      data.assigneeId = null;
    } else {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: assigneeId,
            projectId: req.task.projectId,
          },
        },
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
      data.assigneeId = assigneeId;
    }
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  res.json({ task });
});

router.delete('/:id', requireTaskAccess, async (req, res) => {
  if (req.projectRole !== 'ADMIN' && req.task.createdById !== req.userId) {
    return res.status(403).json({ error: 'Only admins or task creators can delete tasks' });
  }

  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: 'Task deleted' });
});

export default router;
