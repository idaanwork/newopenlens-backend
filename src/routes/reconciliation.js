import express from 'express';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const query = db('reconciliation_queue').where({ status: 'pending' });

    if (req.query.status) {
      query.where('status', req.query.status);
    }

    const total = await query.clone().count('* as count').first();
    const items = await query.limit(limit).offset(offset);

    res.json(paginatedResponse(items, req.query.page || 1, limit, total.count));
  } catch (error) {
    logger.error('Get reconciliation queue error:', error);
    res.status(500).json({ error: 'Failed to get reconciliation items' });
  }
});

router.post('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const { action, library_id } = req.body;
    const queueItem = await db('reconciliation_queue').where({ id: req.params.id }).first();
    
    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    const importRow = await db('import_rows').where({ id: queueItem.import_row_id }).first();

    if (action === 'accept') {
      await db('reconciliation_queue').where({ id: req.params.id }).update({ status: 'accepted' });
      await db('import_rows').where({ id: queueItem.import_row_id }).update({ status: 'complete' });
    } else if (action === 'merge' && library_id) {
      await db('import_rows').where({ id: queueItem.import_row_id }).update({ 
        mapped_library_id: library_id,
        status: 'complete'
      });
      await db('reconciliation_queue').where({ id: req.params.id }).update({ status: 'merged' });
    } else if (action === 'override' && library_id) {
      const [newLibId] = await db('libraries').insert(importRow.raw_json);
      await db('import_rows').where({ id: queueItem.import_row_id }).update({ 
        mapped_library_id: newLibId,
        status: 'complete'
      });
      await db('reconciliation_queue').where({ id: req.params.id }).update({ status: 'overridden' });
    } else if (action === 'ignore') {
      await db('import_rows').where({ id: queueItem.import_row_id }).update({ status: 'ignored' });
      await db('reconciliation_queue').where({ id: req.params.id }).update({ status: 'ignored' });
    }

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'resolve_reconciliation',
      target_type: 'reconciliation',
      target_id: req.params.id,
      data: { action, library_id }
    });

    res.json({ message: 'Reconciliation item resolved' });
  } catch (error) {
    logger.error('Resolve reconciliation error:', error);
    res.status(500).json({ error: 'Failed to resolve reconciliation item' });
  }
});

export default router;
