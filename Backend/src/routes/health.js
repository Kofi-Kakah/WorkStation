import { Router } from 'express';
import { getFirestore, getAuth, getStorage } from '../config/firebase.js';

const router = Router();

/**
 * GET /api/health
 * Lightweight liveness probe. Returns 200 if the process is alive.
 * Does not touch Firebase so it stays fast and dependency-free.
 */
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

/**
 * GET /api/health/ready
 * Readiness probe. Verifies Firebase services are initialized.
 */
router.get('/health/ready', async (_req, res) => {
  try {
    const checks = {
      firebase: 'ok',
      firestore: 'ok',
      auth: 'ok',
      storage: 'ok',
    };
    try {
      getFirestore();
    } catch {
      checks.firestore = 'not_initialized';
    }
    try {
      getAuth();
    } catch {
      checks.auth = 'not_initialized';
    }
    try {
      getStorage();
    } catch {
      checks.storage = 'not_initialized';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    return res.status(allOk ? 200 : 503).json({ status: allOk ? 'ready' : 'degraded', checks });
  } catch (error) {
    return res.status(503).json({ status: 'error', error: error?.message });
  }
});

export default router;