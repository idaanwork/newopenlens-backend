import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { testConnection } from './database/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import librariesRoutes from './routes/libraries.js';
import importsRoutes from './routes/imports.js';
import vulnerabilitiesRoutes from './routes/vulnerabilities.js';
import reconciliationRoutes from './routes/reconciliation.js';
import integrationsRoutes from './routes/integrations.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/libraries', librariesRoutes);
app.use('/api/v1/imports', importsRoutes);
app.use('/api/v1/vulnerabilities', vulnerabilitiesRoutes);
app.use('/api/v1/reconciliation', reconciliationRoutes);
app.use('/api/v1/integrations', integrationsRoutes);

app.get('/api/v1/admin/stats', async (req, res) => {
  try {
    const { db } = await import('./database/db.js');
    const [
      totalLibraries,
      totalVulns,
      pendingReconciliation,
      totalUsers
    ] = await Promise.all([
      db('libraries').whereNull('deleted_at').count('* as count').first(),
      db('vulnerabilities').count('* as count').first(),
      db('reconciliation_queue').where({ status: 'pending' }).count('* as count').first(),
      db('users').count('* as count').first()
    ]);

    res.json({
      totalLibraries: totalLibraries.count,
      totalVulnerabilities: totalVulns.count,
      pendingReconciliation: pendingReconciliation.count,
      totalUsers: totalUsers.count,
      criticalVulnerabilities: await db('vulnerabilities').where({ severity: 'critical' }).count('* as count').first()
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  const connected = await testConnection();
  if (!connected) {
    logger.warn('Database connection failed on startup - will retry on first request');
  }

  app.listen(PORT, () => {
    logger.info(`OpenLens backend running on port ${PORT}`);
  });
};

startServer().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

export default app;
