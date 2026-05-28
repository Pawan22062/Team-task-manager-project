import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireProjectMember, requireProjectAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectValidation,
  updateProjectValidation,
  addMemberValidation,
  updateMemberValidation,
} from '../validators/project.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.userId } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const withRole = projects.map((p) => ({
    ...p,
    myRole: p.members.find((m) => m.userId === req.userId)?.role,
  }));

  res.json({ projects: withRole });
});

router.post('/', createProjectValidation, validate, async (req, res) => {
  const { name, description } = req.body;

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      members: {
        create: { userId: req.userId, role: 'ADMIN' },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  res.status(201).json({ project: { ...project, myRole: 'ADMIN' } });
});

router.get('/:id', requireProjectMember, async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  res.json({
    project: { ...project, myRole: req.projectRole },
  });
});

router.patch(
  '/:id',
  requireProjectMember,
  requireProjectAdmin,
  updateProjectValidation,
  validate,
  async (req, res) => {
    const { name, description } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ project });
  }
);

router.delete(
  '/:id',
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  }
);

router.get('/:id/members', requireProjectMember, async (req, res) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json({ members });
});

router.post(
  '/:id/members',
  requireProjectMember,
  requireProjectAdmin,
  addMemberValidation,
  validate,
  async (req, res) => {
    const { email, role = 'MEMBER' } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found. They must register first.' });
    }

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: req.params.id } },
    });
    if (existing) {
      return res.status(409).json({ error: 'User is already a project member' });
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: req.params.id,
        role,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ member });
  }
);

router.patch(
  '/:id/members/:userId',
  requireProjectMember,
  requireProjectAdmin,
  updateMemberValidation,
  validate,
  async (req, res) => {
    const { role } = req.body;
    const { userId } = req.params;

    const admins = await prisma.projectMember.count({
      where: { projectId: req.params.id, role: 'ADMIN' },
    });

    const target = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: req.params.id } },
    });

    if (!target) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (target.role === 'ADMIN' && role === 'MEMBER' && admins <= 1) {
      return res.status(400).json({ error: 'Project must have at least one admin' });
    }

    const member = await prisma.projectMember.update({
      where: { userId_projectId: { userId, projectId: req.params.id } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json({ member });
  }
);

router.delete(
  '/:id/members/:userId',
  requireProjectMember,
  requireProjectAdmin,
  async (req, res) => {
    const { userId } = req.params;

    const target = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: req.params.id } },
    });

    if (!target) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (target.role === 'ADMIN') {
      const adminCount = await prisma.projectMember.count({
        where: { projectId: req.params.id, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the only admin' });
      }
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId: req.params.id } },
    });

    res.json({ message: 'Member removed' });
  }
);

export default router;
