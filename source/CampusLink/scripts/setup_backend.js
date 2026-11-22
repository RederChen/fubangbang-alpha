import { mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { root, backend, python, run, finished } from './local_runtime.js';

await access(path.join(backend, 'requirements.lock.txt'));
await mkdir(path.join(root, '.cache/tmp'), { recursive: true });
const env = { ...process.env, TEMP: path.join(root, '.cache/tmp'), TMP: path.join(root, '.cache/tmp') };
try { await access(python); }
catch { await finished(run(process.env.PYTHON || 'python', ['-m', 'venv', path.join(backend, '.venv')], { env })); }
await finished(run(python, ['-m', 'pip', 'install', '--cache-dir', path.join(root, '.cache/pip'), '-r', 'requirements.lock.txt', '--disable-pip-version-check'], { cwd: backend, env }));
console.log('Backend dependencies are ready. Run npm start to start both services.');
