import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:net';
import { root, backend, python, run, stop, waitFor, finished } from './local_runtime.js';

async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer(); server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
  });
}
const id = Date.now().toString();
if (process.env.E2E_DATABASE_URL) {
  const destination = new URL(process.env.E2E_DATABASE_URL);
  if (destination.protocol !== 'postgresql+psycopg:' || !/^\/campuslink_test_[a-f0-9]{32}$/.test(destination.pathname)) {
    throw new Error('External E2E database must be a newly allocated campuslink_test_<UUID> PostgreSQL database');
  }
}
if (process.env.E2E_UPLOAD_DIR) {
  const uploads = path.resolve(process.env.E2E_UPLOAD_DIR);
  if (!uploads.startsWith(path.resolve(root, '.cache') + path.sep)) throw new Error('E2E uploads must stay inside the workspace cache');
}
const apiPort = await freePort();
const production = Boolean(process.env.E2E_FRONTEND_DIST);
const webPort = production ? apiPort : await freePort();
await mkdir(path.join(root, '.cache/tmp'), { recursive: true });
const env = {
  ...process.env,
  TEMP: path.join(root, '.cache/tmp'), TMP: path.join(root, '.cache/tmp'),
  CAMPUSLINK_DATABASE_URL: process.env.E2E_DATABASE_URL || `sqlite:///${path.join(root, `.cache/e2e-${id}.db`).replaceAll('\\', '/')}`,
  CAMPUSLINK_UPLOAD_DIR: process.env.E2E_UPLOAD_DIR || path.join(root, `.cache/e2e-uploads-${id}`),
  CAMPUSLINK_JWT_SECRET_KEY: randomBytes(48).toString('base64url'),
  CAMPUSLINK_AUTO_CREATE_TABLES: 'true', CAMPUSLINK_SEED_DEMO_DATA: 'false',
  CAMPUSLINK_BACKEND_URL: `http://127.0.0.1:${apiPort}`, VITE_API_BASE_URL: '/api',
  E2E_BASE_URL: `http://127.0.0.1:${webPort}`,
};
if (production) Object.assign(env, {
  CAMPUSLINK_APP_ENV: 'production', CAMPUSLINK_DEBUG: 'false', CAMPUSLINK_AUTO_CREATE_TABLES: 'false',
  CAMPUSLINK_FRONTEND_DIST: process.env.E2E_FRONTEND_DIST,
});
const children = [];
try {
  if (production) await finished(run(python, ['-m', 'tools.db_admin', 'init'], { cwd: backend, env }));
  const api = run(python, ['-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', String(apiPort), '--log-level', 'warning'], { cwd: backend, env }); children.push(api);
  await waitFor(`http://127.0.0.1:${apiPort}/api/health`, api);
  if (!production) {
    const web = run(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { env }); children.push(web);
    await waitFor(env.E2E_BASE_URL, web);
  }
  await finished(run(process.execPath, [path.join(root, 'scripts/test_e2e.js')], { env }));
} finally { await Promise.all(children.map(stop)); }
