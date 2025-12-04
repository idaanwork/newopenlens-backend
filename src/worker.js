import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import { db } from './database/db.js';
import { scanNVD, mergeVulnerabilities } from './services/vulnScanner.js';
import { detectLicense } from './services/licenseDetector.js';
import logger from './utils/logger.js';

const redis = {
  host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
  port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port) || 6379
};

const enrichQueue = new Queue('enrich', { connection: redis });
const reconcileQueue = new Queue('reconcile', { connection: redis });

const enrichWorker = new Worker('enrich', async (job) => {
  try {
    logger.info(`Processing enrich job: ${job.id}`);

    if (job.data.type === 'import') {
      const importRecord = await db('import_rows').where({ import_id: job.data.import_id });
      
      for (const row of importRecord) {
        const license = detectLicense(row.raw_json.license_declared);
        
        await db('import_rows').where({ id: row.id }).update({
          raw_json: { ...row.raw_json, license_detected: license }
        });

        const existing = await db('libraries')
          .where({ name: row.raw_json.name, version: row.raw_json.version })
          .whereNull('deleted_at')
          .first();

        if (existing) {
          await db('import_rows').where({ id: row.id }).update({
            mapped_library_id: existing.id
          });
        } else {
          await reconcileQueue.add('row', { import_row_id: row.id });
        }
      }

      job.progress(100);
      return { completed: true, processed: importRecord.length };
    }

    if (job.data.type === 'library') {
      const library = await db('libraries').where({ id: job.data.library_id }).first();
      if (!library) {
        throw new Error('Library not found');
      }

      const vulns = await scanNVD(library.name, library.version);
      
      if (vulns.length > 0) {
        for (const vuln of vulns) {
          const existing = await db('vulnerabilities')
            .where({ library_id: library.id, cve_id: vuln.cve_id })
            .first();

          if (!existing) {
            await db('vulnerabilities').insert({
              library_id: library.id,
              cve_id: vuln.cve_id,
              severity: vuln.severity,
              description: vuln.description,
              published_date: vuln.published_date
            });
          }
        }

        await db('libraries').where({ id: library.id }).update({
          vulnerability_count: vulns.length
        });
      }

      job.progress(100);
      return { completed: true, vulnerabilities: vulns.length };
    }

    return { completed: false };
  } catch (error) {
    logger.error(`Error processing enrich job: ${job.id}`, error);
    throw error;
  }
}, { connection: redis, concurrency: parseInt(process.env.WORKER_CONCURRENCY || 10) });

const reconcileWorker = new Worker('reconcile', async (job) => {
  try {
    logger.info(`Processing reconcile job: ${job.id}`);

    const row = await db('import_rows').where({ id: job.data.import_row_id }).first();
    if (!row) {
      throw new Error('Import row not found');
    }

    const candidates = await db('libraries')
      .where('name', 'ilike', `%${row.raw_json.name}%`)
      .whereNull('deleted_at')
      .limit(5);

    let confidence = 0;
    let suggested = null;

    if (candidates.length > 0) {
      suggested = candidates[0];
      confidence = candidates[0].version === row.raw_json.version ? 0.95 : 0.7;
    }

    await db('reconciliation_queue').insert({
      import_row_id: row.id,
      suggested_lib_name: suggested?.name,
      suggested_version: suggested?.version,
      detected_license: row.raw_json.license_detected,
      status: 'pending',
      confidence
    });

    job.progress(100);
    return { completed: true, confidence };
  } catch (error) {
    logger.error(`Error processing reconcile job: ${job.id}`, error);
    throw error;
  }
}, { connection: redis, concurrency: 5 });

enrichWorker.on('failed', (job, err) => {
  logger.error(`Enrich job ${job.id} failed:`, err);
});

reconcileWorker.on('failed', (job, err) => {
  logger.error(`Reconcile job ${job.id} failed:`, err);
});

logger.info('Worker started, listening for jobs...');

process.on('SIGTERM', async () => {
  await enrichWorker.close();
  await reconcileWorker.close();
  logger.info('Worker shut down gracefully');
  process.exit(0);
});
