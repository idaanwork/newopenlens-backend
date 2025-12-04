import express from 'express';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/github/connect', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'GitHub token is required' });
    }

    await db('integrations').where({ user_id: req.user.id, type: 'github' }).del();
    
    const [id] = await db('integrations').insert({
      user_id: req.user.id,
      type: 'github',
      config: { token }
    });

    logger.info(`GitHub integration connected for user ${req.user.id}`);
    res.json({ id, message: 'GitHub integration connected' });
  } catch (error) {
    logger.error('GitHub connect error:', error);
    res.status(500).json({ error: 'Failed to connect GitHub' });
  }
});

router.post('/jira/connect', authMiddleware, async (req, res) => {
  try {
    const { url, email, token } = req.body;
    
    if (!url || !email || !token) {
      return res.status(400).json({ error: 'Jira URL, email, and token are required' });
    }

    await db('integrations').where({ user_id: req.user.id, type: 'jira' }).del();
    
    const [id] = await db('integrations').insert({
      user_id: req.user.id,
      type: 'jira',
      config: { url, email, token }
    });

    logger.info(`Jira integration connected for user ${req.user.id}`);
    res.json({ id, message: 'Jira integration connected' });
  } catch (error) {
    logger.error('Jira connect error:', error);
    res.status(500).json({ error: 'Failed to connect Jira' });
  }
});

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const integrations = await db('integrations').where({ user_id: req.user.id });
    res.json(integrations);
  } catch (error) {
    logger.error('List integrations error:', error);
    res.status(500).json({ error: 'Failed to list integrations' });
  }
});

router.delete('/:type', authMiddleware, async (req, res) => {
  try {
    await db('integrations').where({ user_id: req.user.id, type: req.params.type }).del();
    logger.info(`${req.params.type} integration disconnected for user ${req.user.id}`);
    res.json({ message: `${req.params.type} integration disconnected` });
  } catch (error) {
    logger.error('Disconnect integration error:', error);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

export default router;
