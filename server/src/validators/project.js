import { body, param } from 'express-validator';

export const createProjectValidation = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Project name required'),
  body('description').optional().trim().isLength({ max: 500 }),
];

export const updateProjectValidation = [
  param('id').notEmpty(),
  body('name').optional().trim().isLength({ min: 2, max: 120 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

export const addMemberValidation = [
  param('id').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['ADMIN', 'MEMBER']),
];

export const updateMemberValidation = [
  param('id').notEmpty(),
  param('userId').notEmpty(),
  body('role').isIn(['ADMIN', 'MEMBER']),
];
