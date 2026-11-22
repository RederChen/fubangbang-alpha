import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:net';
import { root, backend, python, run, waitFor, stop, ensureLocalSettings } from './local_runtime.js';
import { postgresEnv } from './postgres_runtime.js';

const latest = JSON.parse(await readFile(path.join(root, '.releases/latest.json'), 'utf8'));
const releaseRoot = path.resolve(root, '.releases');
const folder = path.resolve(releaseRoot, latest.directory);
if (!folder.startsWith(releaseRoot + path.sep)) throw new Error('Release folder must stay within .releases');
const site = path.join(folder, 'site');
await access(path.join(site, 'index.html'));
const port = process.env.CAMPUSLINK_RELEASE_PORT || '8080';
await new Promise((resolve, reject) => {
  const check = createServer(); check.once('error', reject);
  check.listen(Number(port), '127.0.0.1', () => check.close(resolve));
});
const restoreIndex = process.argv.indexOf('--restore');
const restore = restoreIndex >= 0 ? process.argv[restoreIndex + 1] : undefined;
if (restoreIndex >= 0 && !restore) throw new Error('--restore requires the identifier returned by restore:postgres');
await ensureLocalSettings();
const env = {
  ...process.env, ...await postgresEnv(restore), CAMPUSLINK_APP_ENV: 'production',
  CAMPUSLINK_DEBUG: 'false', CAMPUSLINK_SEED_DEMO_DATA: 'false', CAMPUSLINK_AUTO_CREATE_TABLES: 'false',
  CAMPUSLINK_FRONTEND_DIST: site, TEMP: path.join(root, '.cache/tmp'), TMP: path.join(root, '.cache/tmp'),
};
const api = run(python, ['-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', port], { cwd: backend, env });
let stopping = false;
async function shutdown(code) { if (stopping) return; stopping = true; await stop(api); process.exit(code); }
process.once('SIGINT', () => void shutdown(0)); process.once('SIGTERM', () => void shutdown(0));
try {
  await waitFor(`http://127.0.0.1:${port}/api/health`, api);
  console.log(`Production build + PostgreSQL: http://127.0.0.1:${port}/ (Ctrl+C stops the web service; PostgreSQL remains available)`);
  api.once('exit', code => { if (!stopping) void shutdown(code || 1); });
} catch (error) { console.error(error.message); await shutdown(1); }
