import path from 'node:path';
import { root, python, run, finished } from './local_runtime.js';
try {
  await finished(run(python, [path.join(root, 'scripts/postgres_local.py'), ...process.argv.slice(2)]));
} catch { process.exitCode = 1; }
