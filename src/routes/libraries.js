import express from 'express';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';
import { validate, librarySchema } from '../utils/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const query = db('libraries').whereNull('deleted_at');

    if (req.query.q) {
      query.where('name', 'ilike', `%${req.query.q}%`);
    }
    if (req.query.license) {
      query.where('license_detected', req.query.license);
    }
    if (req.query.owner) {
      query.where('owner', req.query.owner);
    }

    const total = await query.clone().count('* as count').first();
    const libraries = await query.limit(limit).offset(offset);

    res.json(paginatedResponse(libraries, req.query.page || 1, limit, total.count));
  } catch (error) {
    logger.error('Get libraries error:', error);
    res.status(500).json({ error: 'Failed to get libraries' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const library = await db('libraries').where({ id: req.params.id }).whereNull('deleted_at').first();
    if (!library) {
      return res.status(404).json({ error: 'Library not found' });
    }

    const vulnerabilities = await db('vulnerabilities').where({ library_id: library.id });
    res.json({ ...library, vulnerabilities });
  } catch (error) {
    logger.error('Get library error:', error);
    res.status(500).json({ error: 'Failed to get library' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const validation = validate(req.body, librarySchema);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const [id] = await db('libraries').insert(validation.value);
    const library = await db('libraries').where({ id }).first();

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'create_library',
      target_type: 'library',
      target_id: id,
      data: validation.value
    });

    res.status(201).json(library);
  } catch (error) {
    logger.error('Create library error:', error);
    res.status(500).json({ error: 'Failed to create library' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const validation = validate(req.body, librarySchema);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    await db('libraries').where({ id: req.params.id }).update(validation.value);
    const library = await db('libraries').where({ id: req.params.id }).first();

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'update_library',
      target_type: 'library',
      target_id: req.params.id,
      data: validation.value
    });

    res.json(library);
  } catch (error) {
    logger.error('Update library error:', error);
    res.status(500).json({ error: 'Failed to update library' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db('libraries').where({ id: req.params.id }).update({ deleted_at: new Date() });

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'delete_library',
      target_type: 'library',
      target_id: req.params.id
    });

    res.json({ message: 'Library deleted' });
  } catch (error) {
    logger.error('Delete library error:', error);
    res.status(500).json({ error: 'Failed to delete library' });
  }
});

export default router;
