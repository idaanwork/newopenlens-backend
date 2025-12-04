import express from 'express';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req.query);
    const query = db('vulnerabilities');

    if (req.query.severity) {
      query.where('severity', req.query.severity);
    }
    if (req.query.library_id) {
      query.where('library_id', req.query.library_id);
    }

    const total = await query.clone().count('* as count').first();
    const vulns = await query.limit(limit).offset(offset).orderBy('published_date', 'desc');

    res.json(paginatedResponse(vulns, req.query.page || 1, limit, total.count));
  } catch (error) {
    logger.error('Get vulnerabilities error:', error);
    res.status(500).json({ error: 'Failed to get vulnerabilities' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const vuln = await db('vulnerabilities').where({ id: req.params.id }).first();
    if (!vuln) {
      return res.status(404).json({ error: 'Vulnerability not found' });
    }

    const library = await db('libraries').where({ id: vuln.library_id }).first();
    res.json({ ...vuln, library });
  } catch (error) {
    logger.error('Get vulnerability error:', error);
    res.status(500).json({ error: 'Failed to get vulnerability' });
  }
});

router.get('/library/:libraryId/summary', authMiddleware, async (req, res) => {
  try {
    const vulns = await db('vulnerabilities').where({ library_id: req.params.libraryId });
    
    const summary = {
      total: vulns.length,
      by_severity: {
        critical: vulns.filter(v => v.severity === 'critical').length,
        high: vulns.filter(v => v.severity === 'high').length,
        medium: vulns.filter(v => v.severity === 'medium').length,
        low: vulns.filter(v => v.severity === 'low').length
      }
    };

    res.json(summary);
  } catch (error) {
    logger.error('Get vulnerability summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

export default router;
