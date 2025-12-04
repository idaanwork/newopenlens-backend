import express from 'express';
import multer from 'multer';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js';
import { saveFile, parseCSV, parseJSON, deleteFile } from '../services/storage.js';
import logger from '../utils/logger.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const storageResult = await saveFile(req.file.originalname, req.file.buffer);
    
    let data;
    if (req.file.mimetype === 'application/json') {
      data = parseJSON(req.file.buffer);
    } else {
      data = parseCSV(req.file.buffer);
    }

    const [importId] = await db('imports').insert({
      filename: req.file.originalname,
      uploaded_by_user_id: req.user.id,
      rows_count: data.rows.length,
      storage_key: storageResult.key,
      status: 'pending'
    });

    for (const row of data.rows.slice(0, 1000)) {
      await db('import_rows').insert({
        import_id: importId,
        source_id: row.id || row.name || '',
        raw_json: row,
        status: 'pending'
      });
    }

    const importRecord = await db('imports').where({ id: importId }).first();
    const rows = await db('import_rows').where({ import_id: importId }).limit(5);

    res.status(201).json({
      import: importRecord,
      preview: {
        headers: Object.keys(data.rows[0] || {}),
        rows: rows
      }
    });
  } catch (error) {
    logger.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import file' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const importRecord = await db('imports').where({ id: req.params.id }).first();
    if (!importRecord) {
      return res.status(404).json({ error: 'Import not found' });
    }

    const rows = await db('import_rows').where({ import_id: req.params.id });
    res.json({ import: importRecord, rows });
  } catch (error) {
    logger.error('Get import error:', error);
    res.status(500).json({ error: 'Failed to get import' });
  }
});

router.get('/:id/preview', authMiddleware, async (req, res) => {
  try {
    const importRecord = await db('imports').where({ id: req.params.id }).first();
    if (!importRecord) {
      return res.status(404).json({ error: 'Import not found' });
    }

    const { limit, offset } = getPaginationParams(req.query);
    const rows = await db('import_rows').where({ import_id: req.params.id }).limit(limit).offset(offset);
    const total = await db('import_rows').where({ import_id: req.params.id }).count('* as count').first();

    res.json(paginatedResponse(rows, req.query.page || 1, limit, total.count));
  } catch (error) {
    logger.error('Get preview error:', error);
    res.status(500).json({ error: 'Failed to get preview' });
  }
});

router.post('/:id/map', authMiddleware, async (req, res) => {
  try {
    const { mapping } = req.body;
    const importRecord = await db('imports').where({ id: req.params.id }).first();
    if (!importRecord) {
      return res.status(404).json({ error: 'Import not found' });
    }

    const rows = await db('import_rows').where({ import_id: req.params.id });
    
    for (const row of rows) {
      const mapped = {};
      for (const [csvCol, dbField] of Object.entries(mapping)) {
        mapped[dbField] = row.raw_json[csvCol];
      }

      const existing = await db('libraries')
        .where({ name: mapped.name, version: mapped.version })
        .whereNull('deleted_at')
        .first();

      if (existing) {
        await db('import_rows').where({ id: row.id }).update({
          mapped_library_id: existing.id,
          status: 'mapped'
        });
      } else {
        const [libId] = await db('libraries').insert(mapped);
        await db('import_rows').where({ id: row.id }).update({
          mapped_library_id: libId,
          status: 'mapped'
        });

        await db('reconciliation_queue').insert({
          import_row_id: row.id,
          suggested_lib_name: mapped.name,
          suggested_version: mapped.version,
          detected_license: mapped.license_detected,
          status: 'pending',
          confidence: 0.8
        });
      }
    }

    await db('imports').where({ id: req.params.id }).update({ status: 'completed' });

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'map_import',
      target_type: 'import',
      target_id: req.params.id,
      data: { mapping }
    });

    res.json({ message: 'Mapping completed' });
  } catch (error) {
    logger.error('Map import error:', error);
    res.status(500).json({ error: 'Failed to map import' });
  }
});

export default router;
