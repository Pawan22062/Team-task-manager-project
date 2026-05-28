import { body, param } from 'express-validator';

export const createTaskValidation = [
  param('id').notEmpty(),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('dueDate').optional({ values: 'null' }).isISO8601().toDate(),
  body('assigneeId').optional({ values: 'null' }).isString(),
];

export const updateTaskValidation = [
  param('id').notEmpty(),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('dueDate').optional({ values: 'null' }).isISO8601().toDate(),
  body('assigneeId').optional({ values: 'null' }).isString(),
];
