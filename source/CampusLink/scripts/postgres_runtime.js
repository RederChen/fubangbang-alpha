import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { root, python, run, finished } from './local_runtime.js';

export async function postgresEnv(restore) {
  await finished(run(python, [path.join(root, 'scripts/postgres_local.py'), 'start']));
  const settings = JSON.parse(await readFile(path.join(root, '.local/postgres/credentials.json'), 'utf8'));
  const { user, password } = settings.app;
  let database = 'campuslink_local';
  const extra = {};
  if (restore) {
    if (!/^campuslink_restore_[a-f0-9]{32}$/.test(restore)) throw new Error('Invalid restore identifier');
    const record = JSON.parse(await readFile(path.join(root, '.local/postgres/restores', `${restore}.json`), 'utf8'));
    const uploads = path.resolve(record.uploads);
    if (record.database !== restore || !uploads.startsWith(path.resolve(root, '.local/restores') + path.sep)) throw new Error('Restore paths must stay inside this workspace');
    database = restore;
    extra.CAMPUSLINK_UPLOAD_DIR = uploads;
  }
  return {
    CAMPUSLINK_DATABASE_URL: `postgresql+psycopg://${encodeURIComponent(user)}:${encodeURIComponent(password)}@127.0.0.1:${settings.port}/${database}`,
    CAMPUSLINK_SEED_DEMO_DATA: 'false', CAMPUSLINK_DEBUG: 'false',
    ...extra,
  };
}

// Keeping this helper private prevents accidental DSN logging from child stdout.
export async function postgresVersion() {
  const { stdout } = await promisify(execFile)(python, [path.join(root, 'scripts/postgres_local.py'), 'status'], { cwd: root, windowsHide: true });
  return stdout.trim();
}
