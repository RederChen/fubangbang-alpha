import { access, mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { createServer } from 'node:net';
import { root, backend, python, run, stop, waitFor } from './local_runtime.js';
import { postgresEnv } from './postgres_runtime.js';

async function portAvailable(port) {
  await new Promise((resolve, reject) => {
    const server = createServer(); server.once('error', reject);
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
await access(python).catch(() => { throw new Error('Backend environment missing. Run npm run setup:backend first.'); });
await access(path.join(root, 'node_modules/vite/bin/vite.js'));
await portAvailable(8000); await portAvailable(5173);
await mkdir(path.join(root, '.cache/tmp'), { recursive: true });
try {
  await writeFile(path.join(backend, '.env'), `CAMPUSLINK_JWT_SECRET_KEY=${randomBytes(48).toString('base64url')}\nCAMPUSLINK_DEBUG=false\n`, { flag: 'wx' });
  console.log('Created private local backend settings; existing settings are never overwritten.');
} catch (error) { if (error.code !== 'EEXIST') throw error; }
const env = { ...process.env, TEMP: path.join(root, '.cache/tmp'), TMP: path.join(root, '.cache/tmp'),
  ...(process.argv.includes('--postgres') ? await postgresEnv() : {}) };
const children = [];
let stopping = false;
async function shutdown(code) {
  if (stopping) return; stopping = true;
  await Promise.all(children.map(stop));
  process.exit(code);
}
process.once('SIGINT', () => void shutdown(0));
process.once('SIGTERM', () => void shutdown(0));
try {
  const api = run(python, ['-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', '8000'], { cwd: backend, env });
  children.push(api);
  await waitFor('http://127.0.0.1:8000/api/health', api);
  const web = run(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { env });
  children.push(web);
  await waitFor('http://127.0.0.1:5173/', web);
  console.log('\nCampusLink: http://127.0.0.1:5173/\nAPI docs: http://127.0.0.1:8000/docs\nPress Ctrl+C to stop both services.');
  for (const child of children) child.once('exit', code => { if (!stopping) void shutdown(code || 1); });
} catch (error) { console.error(error.message); await shutdown(1); }
