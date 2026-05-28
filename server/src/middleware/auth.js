import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireProjectMember(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: req.userId, projectId },
    },
  });

  if (!membership) {
    return res.status(403).json({ error: 'You are not a member of this project' });
  }

  req.membership = membership;
  req.projectRole = membership.role;
  next();
}

export function requireProjectAdmin(req, res, next) {
  if (req.projectRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export async function requireTaskAccess(req, res, next) {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId || req.params.id },
    include: { project: { include: { members: true } } },
  });

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const membership = task.project.members.find((m) => m.userId === req.userId);
  if (!membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.task = task;
  req.membership = membership;
  req.projectRole = membership.role;
  next();
}
